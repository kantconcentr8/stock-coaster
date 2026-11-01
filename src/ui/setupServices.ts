import { createAudio } from '@/services/audio';
import { installErrorBoundary } from '@/core/errorBoundary';
import { gameStorage } from '@/services/storage';
import { captureAttribution, buildCtaUrl } from '@/services/attribution';
import { createAnalytics } from '@/services/analytics/adapter';
import { createTransport } from '@/services/analytics/transports';
import { createBriefingPanel } from '@/ui/screens/briefing';
import type { App } from '@/app';
import type { Briefing } from '@/core/types';
import { renderFallback } from '@/ui/screens/fallback';
export function setupServices(app: App, briefing: Briefing, ui: HTMLElement) {
  const storage = gameStorage;
  const audio = createAudio(app.bus, storage);
  const syncMotion = () => {
    document.documentElement.dataset.reducedMotion = String(
      storage.getPrefs().reducedMotion ??
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
        false,
    );
  };
  syncMotion();
  window.addEventListener('cc-preferences', syncMotion);
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener('change', syncMotion);
  const attribution = captureAttribution(window.location.search);
  const ctaUrl = buildCtaUrl(briefing.cta, attribution);
  const onCta = () =>
    app.bus.emit({
      type: 'ctaClick',
      ctaId: briefing.cta.id,
      destinationCategory: briefing.cta.destinationCategory,
    });
  const analytics =
    (import.meta.env.DEV || import.meta.env.MODE === 'test-preview') &&
    new URLSearchParams(window.location.search).get('analytics') === 'debug'
      ? createAnalytics({
          bus: app.bus,
          briefing,
          attribution,
          transport: createTransport(window.location.search),
          stats: () => app.sim.state.stats,
          deviceClass:
            window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768
              ? 'mobile'
              : 'desktop',
        })
      : undefined;
  const briefingPanel = createBriefingPanel(
    briefing,
    (entryScreen) => app.bus.emit({ type: 'briefingRead', entryScreen }),
    { ctaUrl, onCta },
  );
  const fallback = () => {
    audio.stop();
    app.pauseRun();
    renderFallback(ui);
    const read = ui.querySelector('a');
    read?.addEventListener('click', (event) => {
      event.preventDefault();
      briefingPanel.open('fallback');
    });
    const cta = document.createElement('a');
    cta.href = ctaUrl;
    cta.textContent = briefing.cta.label;
    cta.className = 'btn-primary';
    cta.addEventListener('click', onCta);
    ui.querySelector('#screen-fallback')?.append(cta);
    ui.append(briefingPanel.root);
  };
  installErrorBoundary(
    (code) => app.bus.emit({ type: 'app_error', code }),
    () => {
      app.pauseRun();
      audio.stop();
      const notice = document.createElement('div');
      notice.className = 'error-notice';
      notice.setAttribute('role', 'status');
      const read = document.createElement('button');
      read.textContent = 'Read the briefing';
      read.className = 'btn-secondary';
      read.onclick = () => briefingPanel.open('fallback');
      notice.append('Something went wrong. The briefing is still available. ', read);
      ui.append(notice);
    },
  );

  return { storage, audio, analytics, briefingPanel, fallback, ctaUrl, onCta };
}
