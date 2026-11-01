import './styles.css';
import { createApp } from '@/app';
import course01Json from '@/content/courses/course-01.json';
import { createEventBus } from '@/core/events';
import { createRunClock } from '@/core/runClock';
import { createRunMachine } from '@/core/stateMachine';
import type { CourseDef } from '@/core/types';
import { attachKeyboard } from '@/input/keyboard';
import { attachTouch } from '@/input/touch';
import { createGame } from '@/render/createGame';
import type { GameScene } from '@/render/GameScene';
import { createHud } from '@/ui/hud';
import { createInAppBrowserBanner, isInAppBrowser } from '@/ui/inAppBrowser';
import { createLayoutManager } from '@/ui/layout';
import { createCountdownScreen } from '@/ui/screens/countdown';
import { renderFallback } from '@/ui/screens/fallback';
import { createIntroScreen } from '@/ui/screens/intro';
import { createPauseScreen } from '@/ui/screens/pause';
import { createResultsScreen } from '@/ui/screens/results';
import { createTouchControls } from '@/ui/touchControls';

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
  const layout = createLayoutManager(window);
  let touchEnabled =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

  const hud = createHud(() => app.pauseRun());
  const touchControls = createTouchControls();
  const countdown = createCountdownScreen();

  const updateTouchVisibility = () => {
    const active = app.machine.phase === 'running' || app.machine.phase === 'countdown';
    touchControls.setVisible(touchEnabled && active);
  };

  const intro = createIntroScreen(() => {
    intro.hide();
    countdown.show();
    hud.setVisible(true);
    hud.update(app.sim.state, app.clock.activeTime);
    app.startRun();
    updateTouchVisibility();
  });

  if (isInAppBrowser()) {
    intro.root.prepend(createInAppBrowserBanner());
  }

  const pauseScreen = createPauseScreen({
    onResume: () => {
      pauseScreen.hide();
      countdown.show();
      app.resumeRun();
      updateTouchVisibility();
    },
    onRestart: () => {
      pauseScreen.hide();
      countdown.show();
      app.restartRun();
      hud.setVisible(true);
      hud.update(app.sim.state, app.clock.activeTime);
      updateTouchVisibility();
    },
    onExit: () => {
      pauseScreen.hide();
      countdown.hide();
      hud.setVisible(false);
      app.exitRun();
      updateTouchVisibility();
      intro.show();
    },
  });

  const results = createResultsScreen(() => {
    results.hide();
    countdown.show();
    app.restartRun();
    hud.setVisible(true);
    hud.update(app.sim.state, app.clock.activeTime);
    updateTouchVisibility();
  });

  ui.append(
    hud.root,
    intro.root,
    countdown.root,
    pauseScreen.root,
    results.root,
    touchControls.root,
  );
  intro.show();

  app.bus.on('runStart', () => {
    countdown.hide();
    updateTouchVisibility();
  });

  app.bus.on('pause', () => {
    countdown.hide();
    pauseScreen.show();
    updateTouchVisibility();
  });

  app.bus.on('resume', () => {
    countdown.hide();
    updateTouchVisibility();
  });

  app.bus.on('runComplete', () => {
    hud.setVisible(false);
    updateTouchVisibility();
    results.show(app.sim.state.stats);
  });

  app.bindVisibilityPause(document, window);

  const touchBinding = attachTouch(touchControls, app.input, {
    isActive: () => app.machine.phase === 'running',
    onFirstTouch: () => {
      if (!touchEnabled) {
        touchEnabled = true;
        updateTouchVisibility();
      }
    },
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
      updateTouchVisibility();
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

  const game = createGame(app, 'game', (visAhead, frameSec, steps) => {
    if (app.machine.phase === 'countdown') {
      countdown.update(app.countdownRemaining);
    } else if (app.machine.phase === 'running') {
      hud.update(app.sim.state, app.clock.activeTime);
    }
    debugUpdater?.(visAhead, frameSec, steps);
  });

  layout.onChange((m) => {
    touchBinding.clearPointers();
    const scene = game.scene.getScene('GameScene') as GameScene | undefined;
    scene?.setTrackRegion(m.trackRegion);
  });
} else {
  renderFallback(ui);
}
