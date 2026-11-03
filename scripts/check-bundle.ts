import { readFileSync, existsSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { resolve } from 'node:path';
interface Chunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
  css?: string[];
  assets?: string[];
}
export function measureBundle(directory = 'dist') {
  const manifest = JSON.parse(
    readFileSync(resolve(directory, '.vite/manifest.json'), 'utf8'),
  ) as Record<string, Chunk>;
  const htmlFiles = [
    'index.html',
    ...(existsSync(resolve(directory, 'intraday.html')) ? ['intraday.html'] : []),
  ];
  const files = new Set<string>(htmlFiles);
  const visited = new Set<string>();
  const visit = (key: string) => {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing manifest chunk ${key}`);
    files.add(chunk.file);
    chunk.css?.forEach((file) => files.add(file));
    chunk.assets?.forEach((file) => files.add(file));
    chunk.imports?.forEach(visit);
  };
  Object.entries(manifest)
    .filter(([, value]) => value.isEntry)
    .forEach(([key]) => visit(key));
  // Multi-page builds can emit a shared bootstrap without an isEntry manifest flag.
  // Follow each HTML asset reference rather than accidentally reporting HTML-only cost.
  for (const htmlFile of htmlFiles) {
    const html = readFileSync(resolve(directory, htmlFile), 'utf8');
    for (const match of html.matchAll(/(?:src|href)="\/(assets\/[^" ]+\.(?:js|css))"/g)) {
      const entry = Object.entries(manifest).find(([, chunk]) => chunk.file === match[1]);
      if (!entry)
        throw new Error(`HTML references an asset missing from the manifest: ${match[1]}`);
      visit(entry[0]);
    }
  }
  // Report all JS too: Start requires the dynamically loaded renderer, so don't hide that cost.
  const allFiles = new Set([...files, ...Object.values(manifest).map((chunk) => chunk.file)]);
  const sum = (paths: Set<string>, compress: (data: Buffer) => Buffer) =>
    [...paths].reduce(
      (total, file) => total + compress(readFileSync(resolve(directory, file))).length,
      0,
    );
  return {
    initialGzip: sum(files, gzipSync),
    initialBrotli: sum(files, brotliCompressSync),
    playableGzip: sum(allFiles, gzipSync),
    files: [...files],
  };
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/check-bundle.ts')) {
  if (!existsSync('dist/.vite/manifest.json'))
    throw new Error('Build first: missing Vite manifest');
  const result = measureBundle();
  console.log(JSON.stringify(result, null, 2));
  if (result.initialGzip > 3_000_000 || result.playableGzip > 3_000_000) process.exitCode = 1;
  else if (result.initialGzip > 2_000_000)
    console.warn('Initial transfer above 2 MB warning threshold');
}
