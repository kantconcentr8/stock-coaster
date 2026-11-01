/* global process, MutationObserver, document, window, performance, console */
import { chromium, devices } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const target = process.argv[2];
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 40,
    downloadThroughput: 1125000,
    uploadThroughput: 187500,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      const start = document.querySelector('#btn-start');
      if (start && !start.disabled && !window.__qaReadyMs) {
        window.__qaReadyMs = performance.now();
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true, attributes: true });
  });
  await page.goto(target);
  await page.waitForFunction(() => window.__qaReadyMs > 0);
  const report = {
    target,
    conditions: {
      browser: 'Chromium Pixel 5 emulation on Windows host',
      rttMs: 40,
      downloadMbps: 9,
      uploadMbps: 1.5,
      cpuSlowdown: 4,
      cache: 'disabled',
    },
    ...(await page.evaluate(() => ({
      startReadyMs: window.__qaReadyMs,
      paints: performance
        .getEntriesByType('paint')
        .map((e) => ({ name: e.name, startTime: e.startTime })),
    }))),
  };
  console.log(JSON.stringify(report));
  await writeFile('docs/qa/p5-live/start-ready.json', JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
