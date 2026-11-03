import { mkdtempSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { measureBundle } from '../../scripts/check-bundle';

it('counts shared HTML-referenced bootstrap assets without manifest entry flags', () => {
  const directory = mkdtempSync(join(tmpdir(), 'coaster-bundle-'));
  try {
    mkdirSync(join(directory, '.vite'));
    mkdirSync(join(directory, 'assets'));
    const html = '<script type="module" src="/assets/shared.js"></script>';
    writeFileSync(join(directory, 'index.html'), html);
    writeFileSync(join(directory, 'intraday.html'), html);
    writeFileSync(join(directory, 'assets/shared.js'), 'const shared = 1;');
    writeFileSync(join(directory, 'assets/shared.css'), 'body { color: white; }');
    writeFileSync(
      join(directory, '.vite/manifest.json'),
      JSON.stringify({
        shared: { file: 'assets/shared.js', css: ['assets/shared.css'] },
      }),
    );
    expect(measureBundle(directory).files.sort()).toEqual([
      'assets/shared.css',
      'assets/shared.js',
      'index.html',
      'intraday.html',
    ]);
  } finally {
    for (const file of [
      'index.html',
      'intraday.html',
      'assets/shared.js',
      'assets/shared.css',
      '.vite/manifest.json',
    ])
      unlinkSync(join(directory, file));
    rmdirSync(join(directory, 'assets'));
    rmdirSync(join(directory, '.vite'));
    rmdirSync(directory);
  }
});
