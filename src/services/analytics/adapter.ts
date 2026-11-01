import type { EventBus } from '@/core/events';
import type { Briefing, RunStats } from '@/core/types';
import type { Attribution } from '../attribution';
import { createSafeStore } from '../storage';
import { sanitizeEvent, type EventName, type Payloads } from './contract';
import type { Transport } from './transports';
export function createAnalytics(options: {
  bus: EventBus;
  briefing: Briefing;
  attribution: Attribution;
  transport: Transport;
  stats: () => RunStats;
  deviceClass: 'mobile' | 'desktop';
  getSessionStorage?: () => Storage | undefined;
}) {
  const { bus, briefing, transport } = options;
  const store = createSafeStore(options.getSessionStorage ?? (() => globalThis.sessionStorage));
  const randomId = () => {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // LAN HTTP previews may not expose randomUUID. IDs stay session-only.
      const bytes = new Uint8Array(16);
      try {
        globalThis.crypto.getRandomValues(bytes);
      } catch {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  };
  let sessionId = store.get('cc:v1:session');
  if (!sessionId || !/^[a-f0-9-]{36}$/.test(sessionId)) {
    sessionId = randomId();
    store.set('cc:v1:session', sessionId);
  }
  let runId: string | undefined;
  let completed = false;
  let landingSent = false;
  const emit = <N extends EventName>(name: N, payload: Payloads[N]) => {
    const event = sanitizeEvent(name, {
      briefingId: briefing.briefingId,
      contentVersion: briefing.contentVersion,
      courseVersion: briefing.courseVersion,
      appVersion: '0.0.0',
      deviceClass: options.deviceClass,
      sessionId,
      runId,
      ...payload,
      ...(name === 'landing_view' || name === 'cta_click' ? options.attribution : {}),
    });
    try {
      void Promise.resolve(transport(event)).catch(() => {});
    } catch {
      /* optional transport */
    }
  };
  const off = [
    bus.on('runStart', () => {
      runId = randomId();
      completed = false;
      emit('run_start', {});
    }),
    bus.on('chapterSeen', (e) => emit('chapter_seen', { chapterId: e.chapterId, runTime: e.t })),
    bus.on('runComplete', (e) => {
      if (!runId || completed) return;
      completed = true;
      emit('run_complete', { ...options.stats(), score: e.score });
    }),
    bus.on('restart', (e) =>
      emit('run_restart', { sourceScreen: e.sourceScreen, priorComplete: e.priorComplete }),
    ),
    bus.on('briefingRead', (e) => emit('briefing_read', { entryScreen: e.entryScreen })),
    bus.on('learningAnswer', (e) =>
      emit('learning_answer', { questionId: e.questionId, correct: e.correct }),
    ),
    bus.on('ctaClick', (e) =>
      emit('cta_click', { ctaId: e.ctaId, destinationCategory: e.destinationCategory }),
    ),
    bus.on('shareAction', (e) => emit('share_action', { method: e.method })),
    bus.on('app_error', (e) =>
      emit('app_error', {
        code: ['content_invalid', 'graphics_unavailable'].includes(e.code)
          ? (e.code as 'content_invalid' | 'graphics_unavailable')
          : 'unknown',
      }),
    ),
  ];
  return {
    landing() {
      if (!landingSent) {
        landingSent = true;
        emit('landing_view', {});
      }
    },
    dispose() {
      off.forEach((unsubscribe) => unsubscribe());
    },
  };
}
