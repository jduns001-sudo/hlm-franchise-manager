'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {KEY} = require('./hlm-phase11-isolated-single-game');

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
    await page.locator('#office-summary').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('#office-summary').textContent.includes('Loading isolated'));
    assert.match(await page.locator('#office-summary').innerText(), /No isolated franchise loaded|summary unavailable/);
    const source = createGameStateEnvelope({
      meta: {controlledTeamId: 1, currentDate: '2026-10-20'},
      teams: [{id: 1, name: 'Pittsburgh'}, {id: 2, name: 'Edmonton'}],
      games: [
        {id: 'played', date: '2026-10-20', homeTeamId: 1, awayTeamId: 2, status: 'final', homeGoals: 3, awayGoals: 1},
        {id: 'upcoming', date: '2026-10-21', homeTeamId: 2, awayTeamId: 1, status: 'scheduled'}
      ]
    });
    await page.evaluate(({key, value}) => localStorage.setItem(key, value), {key: KEY, value: JSON.stringify(source)});
    const savedBefore = await page.evaluate(key => localStorage.getItem(key), KEY);
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#office-summary').textContent.includes('Pittsburgh'));
    const summary = await page.locator('#office-summary').innerText();
    assert.match(summary, /Pittsburgh.*1W-0L-0T/);
    assert.match(summary, /at Edmonton on 2026-10-21/);
    assert.match(summary, /GM review still required/);
    const decision = await page.locator('#gm-decision-summary').innerText();
    assert.match(decision, /GM review needed: goalie plan and skater review/);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), savedBefore, 'summary cannot rewrite isolated save');
    const tabs = ['office', 'team', 'calendar', 'assistant', 'menu'];
    for (const id of tabs) {
      await page.locator('nav [data-panel="' + id + '"]').click();
      await page.locator('#' + id).waitFor({ state: 'visible' });
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
