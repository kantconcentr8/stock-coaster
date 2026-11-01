import './styles.css';
import { createApp } from '@/app';
import course01Json from '@/content/courses/course-01.json';
import { createEventBus } from '@/core/events';
import { createRunClock } from '@/core/runClock';
import { createRunMachine } from '@/core/stateMachine';
import type { CourseDef } from '@/core/types';
import { attachKeyboard } from '@/input/keyboard';
import { createGame } from '@/render/createGame';
import { createHud } from '@/ui/hud';
import { createCountdownScreen } from '@/ui/screens/countdown';
import { renderFallback } from '@/ui/screens/fallback';
import { createIntroScreen } from '@/ui/screens/intro';
import { createResultsScreen } from '@/ui/screens/results';

function supportsGraphics(): boolean {
  if (typeof requestAnimationFrame !== 'function') return false;
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl') ?? canvas.getContext('2d'));
}

const ui = document.getElementById('ui');
if (!ui) throw new Error('Missing #ui container');

const app = createApp({
  bus: createEventBus(),
  machine: createRunMachine(),
  clock: createRunClock(),
  course: course01Json as CourseDef,
});

if (supportsGraphics()) {
  const hud = createHud();
  const intro = createIntroScreen(() => {
    intro.hide();
    countdown.show();
    hud.setVisible(true);
    hud.update(app.sim.state, app.clock.activeTime);
    app.startRun();
  });
  const countdown = createCountdownScreen();
  const results = createResultsScreen(() => {
    results.hide();
    countdown.show();
    app.restartRun();
    hud.setVisible(true);
    hud.update(app.sim.state, app.clock.activeTime);
  });

  ui.append(hud.root, intro.root, countdown.root, results.root);
  intro.show();

  app.bus.on('runStart', () => {
    countdown.hide();
  });

  app.bus.on('runComplete', () => {
    hud.setVisible(false);
    results.show(app.sim.state.stats);
  });

  attachKeyboard(window, app.input, {
    isActive: () => app.machine.phase === 'running',
    getPhase: () => app.machine.phase,
    onPause: () => app.pauseRun(),
    onRestart: () => {
      results.hide();
      countdown.show();
      app.restartRun();
      hud.setVisible(true);
      hud.update(app.sim.state, app.clock.activeTime);
    },
  });

  let debugUpdater: ((visAhead: number, frameSec: number, steps: number) => void) | undefined;

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('debug') === '1') {
    void import('@/ui/debugOverlay').then(({ createDebugOverlay }) => {
      const dbg = createDebugOverlay();
      ui.append(dbg.root);
      debugUpdater = (visAhead, frameSec, steps) => {
        dbg.update(app.sim.state, app.track, visAhead, frameSec, steps);
      };
    });
  }

  createGame(app, 'game', (visAhead, frameSec, steps) => {
    if (app.machine.phase === 'countdown') {
      countdown.update(app.countdownRemaining);
    } else if (app.machine.phase === 'running') {
      hud.update(app.sim.state, app.clock.activeTime);
    }
    debugUpdater?.(visAhead, frameSec, steps);
  });
} else {
  renderFallback(ui);
}
