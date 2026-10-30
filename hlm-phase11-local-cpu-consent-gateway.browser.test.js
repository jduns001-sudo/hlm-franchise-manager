'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {createLocalCpuConsentGateway} = require('./hlm-phase11-local-cpu-consent-gateway');

const now = Date.now();
let consentCalls = 0;
const authority = {
  async issueConsent(proposalId, expectedRevision) {
    consentCalls += 1;
    return {
      statusCode: 200,
      body: {
        version: 1,
        schema: 'hlm-local-cpu-consent-v1',
        decisionId: '00000000-0000-4000-8000-000000000001',
        proposalId,
        proposalDigest: 'a'.repeat(64),
        digestSchema: 'hlm-trade-proposal-digest-v1',
        controlledTeamId: 'A',
        teamId: 'B',
        teamIds: ['A', 'B'],
        stateRevision: expectedRevision,
        issuedAt: new Date(now - 1000).toISOString(),
        expiresAt: new Date(now + 60_000).toISOString(),
        keyId: 'a'.repeat(24),
        decision: 'approve',
        cpuDecision: 'accepted',
        signature: 'A'.repeat(86)
      }
    };
  }
};

(async () => {
  let browser;
  const gatewayService = createLocalCpuConsentGateway({
    enabled: true,
    authority,
    developmentPage: '<!doctype html><meta charset="utf-8"><title>Local gateway cookie test</title><p>Local-only gateway test page</p>'
  });
  try {
    const gateway = await gatewayService.start();
    assert.equal(gateway.host, '127.0.0.1');
    browser = await chromium.launch({headless: true});
    const context = await browser.newContext();
    const page = await context.newPage();
    const requests = [];
    page.on('request', request => requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    }));

    await page.goto(gateway.url);
    assert.equal(await page.title(), 'Local gateway cookie test');
    assert.equal(await page.evaluate(() => document.cookie), '');

    const session = await page.evaluate(async () => {
      const response = await fetch('/v1/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'content-type': 'application/json'}
      });
      return {status: response.status, body: await response.json()};
    });
    assert.equal(session.status, 201);
    const cookies = await context.cookies(gateway.url);
    assert.equal(cookies.length, 1);
    assert.equal(cookies[0].name, '__Host-hlm_exp_cpu_session');
    assert.equal(cookies[0].secure, true);
    assert.equal(cookies[0].httpOnly, true);
    assert.equal(cookies[0].sameSite, 'Strict');
    assert.equal(cookies[0].path, '/');

    const result = await page.evaluate(async tokens => {
      const response = await fetch('/v1/consent', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': tokens.csrfToken,
          'x-request-nonce': tokens.requestNonce
        },
        body: JSON.stringify({proposalId: 'browser-session-proposal', expectedRevision: 'rev-1'})
      });
      return {
        status: response.status,
        body: await response.json(),
        csrf: response.headers.get('x-csrf-token'),
        nonce: response.headers.get('x-request-nonce')
      };
    }, session.body);
    assert.equal(result.status, 200);
    assert.equal(result.body.schema, 'hlm-local-cpu-consent-v1');
    assert.match(result.csrf, /^[A-Za-z0-9_-]{43}$/);
    assert.match(result.nonce, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(consentCalls, 1);

    const consentRequest = requests.find(item => item.url.endsWith('/v1/consent'));
    assert.ok(consentRequest);
    assert.doesNotMatch(consentRequest.headers.cookie || '', /apiToken|privateKey|sqlite/i);
    assert.equal(await page.evaluate(() => document.cookie), '');
    assert.ok(requests.every(item => new URL(item.url).origin === gateway.url));
    assert.deepEqual(requests.map(item => new URL(item.url).pathname),
      ['/', '/v1/session', '/v1/consent']);

    console.log('Loopback Chromium Secure/HttpOnly cookie and authenticated consent checks passed.');
    await context.close();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await gatewayService.close();
  }
})();
