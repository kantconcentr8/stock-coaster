import './styles.css';
import { createApp } from '@/app';
import { loadBriefing } from '@/content';
import { createCaptions } from '@/ui/captions';
import { createChapterScheduler } from '@/sim/chapters';
import { createBriefingPanel } from '@/ui/screens/briefing';
import { createEventBus } from '@/core/events';
import { createRunClock } from '@/core/runClock';
import { createRunMachine } from '@/core/stateMachine';
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

let loaded: ReturnType<typeof loadBriefing> | undefined;
try {
  loaded = loadBriefing(window.location.search);
} catch (error) {
  const bus = createEventBus();
  bus.emit({ type: 'app_error', code: 'content_invalid' });
  console.error('app_error', { code: 'content_invalid', error });
  renderFallback(ui, true);
}
if (loaded) {
  const { briefing, course, notice } = loaded;
  const app = createApp({
    bus: createEventBus(),
    machine: createRunMachine(),
    clock: createRunClock(),
    course,
    chapters: briefing.chapters,
  });

  const briefingPanel = createBriefingPanel(briefing, (entryScreen) =>
    app.bus.emit({ type: 'briefingRead', entryScreen }),
  );
  if (supportsGraphics()) {
    const layout = createLayoutManager(window);
    let touchEnabled =
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

    const captions = createCaptions();
    const chapterView = createChapterScheduler(briefing.chapters);
    const hud = createHud(() => app.pauseRun());
    const touchControls = createTouchControls();
    const countdown = createCountdownScreen();

    const updateTouchVisibility = () => {
      const active = app.machine.phase === 'running' || app.machine.phase === 'countdown';
      touchControls.setVisible(touchEnabled && active);
    };

    const intro = createIntroScreen(
      () => {
        intro.hide();
        countdown.show();
        hud.setVisible(true);
        hud.update(app.sim.state, app.clock.activeTime);
        app.startRun();
        updateTouchVisibility();
      },
      { briefing, notice, onRead: () => briefingPanel.open('intro') },
    );

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
        captions.update();
        updateTouchVisibility();
        intro.show();
      },
    });

    const results = createResultsScreen(
      () => {
        results.hide();
        countdown.show();
        app.restartRun();
        hud.setVisible(true);
        hud.update(app.sim.state, app.clock.activeTime);
        updateTouchVisibility();
      },
      {
        briefing,
        onRead: () => briefingPanel.open('results'),
        onAnswer: (questionId, correct) =>
          app.bus.emit({ type: 'learningAnswer', questionId, correct }),
      },
    );

    ui.append(
      hud.root,
      captions.root,
      briefingPanel.root,
      intro.root,
      countdown.root,
      pauseScreen.root,
      results.root,
      touchControls.root,
    );
    intro.show();

    app.bus.on('restart', () => {
      chapterView.reset();
      captions.update();
    });
    app.bus.on('runStart', () => {
      chapterView.reset();
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
      captions.update();
      const closing = document.createElement('p');
      closing.className = 'closing-bell';
      closing.textContent = 'Closing bell';
      closing.setAttribute('role', 'status');
      ui.append(closing);
      window.setTimeout(
        () => {
          closing.remove();
          if (app.machine.phase === 'results') results.show(app.sim.state.stats);
        },
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 1000,
      );
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
      getPhase: () => (briefingPanel.root.open ? 'intro' : app.machine.phase),
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
        captions.update(chapterView.update(app.clock.activeTime));
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
    const read = ui.querySelector('a');
    read?.addEventListener('click', (event) => {
      event.preventDefault();
      briefingPanel.open('fallback');
    });
    ui.append(briefingPanel.root);
  }
}
