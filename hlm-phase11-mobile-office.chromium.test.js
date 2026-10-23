'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const server = http.createServer((req, res) => {
    const name = path.basename(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!/^hlm-[a-z0-9.-]+$/.test(name)) { res.writeHead(404); res.end(); return; }
    fs.readFile(path.join(__dirname, name), (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'text/html');
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const url = 'http://127.0.0.1:' + server.address().port + '/hlm-phase11-mobile-office.html';
    await page.goto(url);
    const tabs = ['office', 'team', 'calendar', 'assistant', 'menu'];
    for (const id of tabs) {
      await page.locator('nav [data-panel="' + id + '"]').click();
      assert.equal(await page.locator('#' + id).isVisible(), true, id + ' visible');
      assert.equal(await page.locator('.panel:visible').count(), 1, 'exactly one panel visible');
      assert.equal(await page.locator('nav [aria-current="page"]').getAttribute('data-panel'), id, id + ' active');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, id + ' no horizontal overflow');
    }
    await page.reload();
    assert.equal(await page.locator('#menu').isVisible(), true, 'reload restores hash-selected tab');
    await page.locator('nav [data-panel="office"]').click();
    const resume = page.getByRole('link', { name: /Resume franchise/i });
    const prepare = page.getByRole('link', { name: /Prepare next game/i });
    assert.match(await resume.getAttribute('href'), /hlm-phase11-isolated-single-game\.html#gm-next-action-heading$/);
    assert.match(await prepare.getAttribute('href'), /hlm-phase11-isolated-single-game\.html#gm-game-day-workspace-heading$/);
    const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    await page.locator('nav [data-panel="team"]').click();
    await page.locator('nav [data-panel="calendar"]').click();
    const after = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    assert.deepEqual(after, before, 'navigation must not mutate browser storage');
    console.log('Mission 1507A mobile Chromium navigation acceptance passed');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
