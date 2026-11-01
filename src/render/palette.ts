/** Renderer consumes the CSS brand tokens, retaining deterministic fallbacks for tests. */
function color(token: string, fallback: string) {
  const value =
    typeof document === 'undefined'
      ? fallback
      : getComputedStyle(document.documentElement).getPropertyValue(token).trim() || fallback;
  return Number.parseInt(value.replace('#', ''), 16);
}
export const PALETTE = {
  white: color('--color-white', '#ffffff'),
  black: color('--color-black', '#000000'),
  orange: color('--color-orange', '#fca311'),
  alabaster: color('--color-alabaster', '#e5e5e5'),
  cyan: color('--color-cyan', '#90e0ef'),
  pickup: color('--color-pickup', '#00bbf9'),
  ink: color('--color-ink', '#001219'),
};
