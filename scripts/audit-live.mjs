/* global URL, process, fetch, document, sessionStorage, console */
import { chromium, webkit, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const target = new URL(process.argv[2]);
if (target.protocol !== 'https:') throw new Error('HTTPS target required');
const output = 'docs/qa/p5-live';
await mkdir(output, { recursive: true });
const response = await fetch(target);
const html = await response.text();
const headers = Object.fromEntries(response.headers);
const asset = html.match(/src="([^"]+\.js)"/)[1];
const assetResponse = await fetch(new URL(asset, target), { method: 'HEAD' });
const report = {
  target: target.href,
  checkedAt: new Date().toISOString(),
  status: response.status,
  headers,
  assetHeaders: Object.fromEntries(assetResponse.headers),
  browsers: [],
};
await Promise.all(
  [
    ['chromium', chromium, {}],
    ['webkit-mobile', webkit, devices['iPhone 13']],
  ].map(async ([name, engine, device]) => {
    const browser = await engine.launch();
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const result = { name, errors };
    try {
      let outbound;
      await context.route('https://predictourney.site/**', (route) => {
        outbound = route.request().url();
        return route.fulfill({
          contentType: 'text/html',
          body: '<p>Intercepted QA destination; no signup</p>',
        });
      });
      await page.goto(
        new URL(
          '?experience=game&b=2026-10-31-lower-value&utm_source=phase5&utm_campaign=qa&email=excluded',
          target,
        ).href,
      );
      await page.locator('#btn-start').waitFor();
      await page.waitForFunction(() => !document.querySelector('#btn-start').disabled);
      result.metadata = await page.evaluate(() => ({
        title: document.title,
        canonical: document.querySelector('link[rel=canonical]')?.href,
        image: document.querySelector('meta[property="og:image"]')?.content,
        robots: document.querySelector('meta[name=robots]')?.content,
      }));
      result.introAxe = (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
        id: v.id,
        impact: v.impact,
      }));
      await page.screenshot({ path: `${output}/${name}-intro.png` });
      await page.getByRole('button', { name: 'Read the briefing', exact: true }).click();
      result.briefingReadable = await page.locator('#briefing').isVisible();
      await page.getByRole('button', { name: 'Close briefing' }).click();
      const start = Date.now();
      await page.locator('#btn-start').click();
      await page.locator('#screen-results').waitFor({ state: 'visible', timeout: 120000 });
      result.wallSecondsToResults = (Date.now() - start) / 1000;
      result.score = await page.locator('#res-score').innerText();
      result.best = await page.locator('#local-best').innerText();
      result.resultsAxe = (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
        id: v.id,
        impact: v.impact,
      }));
      await page.screenshot({ path: `${output}/${name}-results.png` });
      await page.locator('#briefing-cta').evaluate((link) => {
        link.target = '_blank';
      });
      const popup = page.waitForEvent('popup');
      await page.locator('#briefing-cta').click();
      const destination = await popup;
      await destination.waitForLoadState();
      result.outbound = outbound;
      await destination.close();
      result.analyticsIdentity = await page.evaluate(() => sessionStorage.getItem('cc:v1:session'));
      result.passed =
        result.wallSecondsToResults >= 60 &&
        !errors.length &&
        Boolean(outbound) &&
        !new URL(outbound).searchParams.has('email') &&
        !result.analyticsIdentity &&
        ![...result.introAxe, ...result.resultsAxe].some((v) =>
          ['serious', 'critical'].includes(v.impact),
        );
    } catch (error) {
      result.failure = error.message;
      result.passed = false;
    } finally {
      await browser.close();
    }
    report.browsers.push(result);
    console.log(JSON.stringify(result));
  }),
);
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
if (report.browsers.some((result) => !result.passed)) process.exitCode = 1;
