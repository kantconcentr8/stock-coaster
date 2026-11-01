import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const css = readFileSync('src/styles.css', 'utf8');
const token = (name: string) => {
  const match = css.match(new RegExp(`${name}:\\s*(#[a-fA-F0-9]{6})`));
  if (!match) throw new Error(`Missing token ${name}`);
  return match[1]!;
};
const luminance = (hex: string) => {
  const rgb = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
};
const ratio = (foreground: string, background: string) => {
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const pairs = [
  ['Body text', token('--color-alabaster'), token('--color-prussian'), 4.5],
  ['White links/text', token('--color-white'), token('--color-prussian'), 4.5],
  ['Classification/headings', token('--color-orange'), token('--color-prussian'), 4.5],
  ['Primary button/link', token('--color-black'), token('--color-orange'), 4.5],
  ['Secondary text', '#ffffff', '#28313f', 4.5],
  ['Muted results text', '#b4bfd0', '#080d16', 4.5],
  ['Rail/control outline', token('--color-cyan'), token('--color-prussian'), 3],
  ['Pickup glyph', token('--color-ink'), token('--color-pickup'), 3],
] as const;
const results = pairs.map(([label, foreground, background, minimum]) => ({
  label,
  foreground,
  background,
  minimum,
  ratio: Number(ratio(foreground, background).toFixed(2)),
  pass: ratio(foreground, background) >= minimum,
}));
mkdirSync('docs/qa/p5.2', { recursive: true });
writeFileSync('docs/qa/p5.2/contrast.json', JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
if (results.some((row) => !row.pass)) process.exitCode = 1;
