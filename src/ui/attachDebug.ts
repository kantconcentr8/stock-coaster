import type { App } from '@/app';
export function attachDebug(ui: HTMLElement, app: App) {
  let update: ((ahead: number, seconds: number, steps: number) => void) | undefined;
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('debug') === '1') {
    void import('./debugOverlay')
      .then(({ createDebugOverlay }) => {
        const view = createDebugOverlay();
        ui.append(view.root);
        update = (ahead, seconds, steps) =>
          view.update(app.sim.state, app.track, ahead, seconds, steps);
      })
      .catch(() => {});
  }
  return (ahead: number, seconds: number, steps: number) => update?.(ahead, seconds, steps);
}
