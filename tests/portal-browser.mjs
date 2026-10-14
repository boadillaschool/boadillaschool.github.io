#!/usr/bin/env node
/**
 * Real-browser regression for the static portal. No runtime dependency is added.
 * PLAYWRIGHT_MODULE and BROWSER_PATH can point to an isolated test installation.
 * ARTIFACT_DIR optionally stores screenshots and measurements outside the repo.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const artifacts = process.env.ARTIFACT_DIR;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg', '.json': 'application/json',
};

// Match static hosting: deep missing paths receive the actual custom 404 page.
const server = createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, `.${path}`);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': mime['.html'] });
    response.end(await readFile(resolve(root, '404.html')));
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
  });
  if (artifacts) await mkdir(artifacts, { recursive: true });
  const measurements = [];
  for (const viewport of [
    { width: 320, height: 740 }, { width: 412, height: 915 },
    { width: 820, height: 1180 }, { width: 1280, height: 800 },
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => [...document.styleSheets].some((sheet) => sheet.href?.endsWith('/styles.css') && sheet.cssRules.length));
    const link = page.locator('a[href="/spelling/"]');
    assert.equal(await link.count(), 1, 'One direct entry to the real spelling activity');
    const bounds = await link.boundingBox();
    measurements.push({ viewport, action: bounds, bottom: bounds.y + bounds.height });
    if (artifacts) await page.screenshot({ path: `${artifacts}/portal-${viewport.width}.png`, fullPage: true });
    await page.close();
  }
  if (artifacts) await writeFile(`${artifacts}/measurements.json`, JSON.stringify(measurements, null, 2) + '\n');
  console.log(JSON.stringify(measurements, null, 2));
  for (const { viewport, action, bottom } of measurements) {
    assert.ok(action.width >= 48 && action.height >= 48, `Touch target at ${viewport.width}px is at least 48 × 48px`);
    assert.ok(bottom <= viewport.height, `Direct activity CTA at ${viewport.width}px ends at ${bottom}px, below the ${viewport.height}px viewport`);
  }
  console.log('PASS: direct activity visible without scrolling at 320/412/820/1280px.');

  const enlarged = await browser.newPage({ viewport: { width: 320, height: 740 } });
  await enlarged.goto(base, { waitUntil: 'domcontentloaded' });
  await enlarged.waitForFunction(() => [...document.styleSheets].some((sheet) => sheet.href?.endsWith('/styles.css') && sheet.cssRules.length));
  await enlarged.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const overflow = await enlarged.evaluate(() => {
    const issues = [];
    const visible = (element) => !element.closest('.skip-link') && element.getBoundingClientRect().height > 0;
    for (const element of document.body.querySelectorAll('*')) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.left < -1 || rect.right > innerWidth + 1) {
        issues.push({ element: element.tagName, className: element.getAttribute('class'), left: rect.left, right: rect.right });
      }
      if (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1) {
        issues.push({ element: element.tagName, className: element.getAttribute('class'), contentWidth: element.scrollWidth, availableWidth: element.clientWidth });
      }
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || !visible(node.parentElement)) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.left < -1 || rect.right > innerWidth + 1) issues.push({ text: node.textContent.trim(), left: rect.left, right: rect.right });
      }
    }
    return issues;
  });
  console.log('200% text content measurement:', JSON.stringify(overflow, null, 2));
  assert.deepEqual(overflow, [], 'Every content box and line must reflow without clipping at 320px / 200% text');
  await enlarged.close();
  console.log('PASS: content reflows at 200% text.');
  const keyboardPage = await browser.newPage({ viewport: { width: 820, height: 1180 } });
  await keyboardPage.goto(base, { waitUntil: 'networkidle' });
  await keyboardPage.keyboard.press('Tab');
  assert.equal(await keyboardPage.evaluate(() => document.activeElement.className), 'skip-link');
  await keyboardPage.locator('.skip-link').hover();
  assert.equal(await keyboardPage.locator('.skip-link').evaluate(node => getComputedStyle(node).color), 'rgb(255, 255, 255)', 'Focused skip link retains contrast during hover');
  await keyboardPage.keyboard.press('Enter');
  assert.equal(new URL(keyboardPage.url()).hash, '#contenido');
  await keyboardPage.keyboard.press('Tab');
  assert.equal(await keyboardPage.evaluate(() => document.activeElement.getAttribute('href')), '/spelling/', 'Skip link bypasses header navigation');
  const padding = await keyboardPage.locator('.privacy-section').evaluate(node => Number.parseFloat(getComputedStyle(node).paddingTop));
  assert.ok(padding >= 16, 'Privacy text has an inset from its top border');
  await keyboardPage.close();
  console.log('PASS: keyboard bypass, focused hover contrast and privacy-section inset.');
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
