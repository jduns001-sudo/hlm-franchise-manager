'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');

const ROOT = __dirname;
const FILE = 'hlm-phase11-experimental-cpu-trade-entry.html';
let requests = 0;

const server = http.createServer((request, response) => {
  requests += 1;
  if (request.method === 'GET' && request.url === '/') {
    response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
    response.end(fs.readFileSync(path.join(ROOT, FILE)));
    return;
  }
  response.writeHead(404);
  response.end();
});

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

(async () => {
  let browser;
  try {
    const origin = await listen();
    browser = await chromium.launch({headless: true});
    const context = await browser.newContext({
      viewport: {width: 390, height: 844},
      isMobile: true,
      hasTouch: true
    });
    await context.addInitScript(() => {
      window.HLM_PHASE11_EXPERIMENTAL_CPU_TRADING_ENABLED = true;
      window.HLMExperimentalCpuTradeProvider = {
        async createCoordinator() {
          window.providerCalls = (window.providerCalls || 0) + 1;
          return null;
        }
      };
      window.databaseOpens = [];
      const originalOpen = indexedDB.open.bind(indexedDB);
      indexedDB.open = function (name, ...args) {
        window.databaseOpens.push(String(name));
        return originalOpen(name, ...args);
      };
    });
    const page = await context.newPage();
    const localRequests = [];
    page.on('request', request => localRequests.push(request.url()));
    await page.goto(origin);
    assert.equal(await page.evaluate(() => window.innerWidth <= 480), true);
    assert.match(await page.locator('.notice').innerText(), /OFF — no authenticated browser authority is configured/);
    assert.equal(await page.locator('script').count(), 0);
    assert.equal(await page.locator('[data-trade-review]').isDisabled(), true);
    for (const decision of ['approve', 'decline', 'cancel']) {
      assert.equal(await page.locator(`[data-trade-decision="${decision}"]`).isDisabled(), true);
    }
    assert.equal(await page.evaluate(() => window.providerCalls || 0), 0);
    assert.deepEqual(await page.evaluate(() => window.databaseOpens), []);
    assert.equal(requests, 1);
    assert.deepEqual(localRequests, [`${origin}/`]);

    await page.reload();
    assert.match(await page.locator('.notice').innerText(), /OFF — no authenticated browser authority is configured/);
    assert.equal(await page.locator('[data-trade-review]').isDisabled(), true);
    assert.equal(await page.evaluate(() => window.providerCalls || 0), 0);
    assert.deepEqual(await page.evaluate(() => window.databaseOpens), []);
    assert.equal(requests, 2);
    assert.deepEqual(localRequests, [`${origin}/`, `${origin}/`]);

    const publicPage = await context.newPage();
    const publicRequests = [];
    publicPage.on('request', request => publicRequests.push(request.url()));
    const publicUrl = 'https://jduns001-sudo.github.io/hlm-franchise-manager/hlm-phase11-experimental-cpu-trade-entry.html';
    await publicPage.route(publicUrl, route => route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: fs.readFileSync(path.join(ROOT, FILE), 'utf8')
    }));
    await publicPage.goto(publicUrl);
    assert.equal(await publicPage.locator('[data-trade-review]').isDisabled(), true);
    assert.deepEqual(publicRequests, [publicUrl]);

    console.log('Experimental CPU trade entry mobile and GitHub Pages isolation checks passed.');
    await context.close();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})();
