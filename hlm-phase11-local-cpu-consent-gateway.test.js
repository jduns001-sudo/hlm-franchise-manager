'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const {createLocalCpuConsentGateway} = require('./hlm-phase11-local-cpu-consent-gateway');

const PROPOSAL_ID = 'gateway-proposal-1';
const REVISION = 'revision-1';
const NOW = Date.parse('2027-01-02T12:00:00.000Z');
const ORIGIN = gateway => gateway.url;

function envelope(proposalId = PROPOSAL_ID, stateRevision = REVISION, overrides = {}) {
  return {
    version: 1,
    schema: 'hlm-local-cpu-consent-v1',
    decisionId: '00000000-0000-4000-8000-000000000001',
    proposalId,
    proposalDigest: 'a'.repeat(64),
    digestSchema: 'hlm-trade-proposal-digest-v1',
    controlledTeamId: 'A',
    teamId: 'B',
    teamIds: ['A', 'B'],
    stateRevision,
    issuedAt: new Date(NOW - 1000).toISOString(),
    expiresAt: new Date(NOW + 60_000).toISOString(),
    keyId: 'a'.repeat(24),
    decision: 'approve',
    cpuDecision: 'accepted',
    signature: 'A'.repeat(86),
    ...overrides
  };
}

function createAuthority({issueConsent, statusCode = 200, body} = {}) {
  const calls = [];
  return {
    calls,
    authority: {
      async issueConsent(...args) {
        calls.push(args);
        if (issueConsent) return issueConsent(...args);
        return {statusCode, body: body || envelope(args[0], args[1])};
      }
    }
  };
}

function request(gateway, {
  path = '/v1/session',
  method = 'POST',
  origin = ORIGIN(gateway),
  host = `${new URL(gateway.url).host}`,
  cookie,
  csrf,
  nonce,
  contentType = 'application/json',
  fetchSite = 'same-origin',
  body
} = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(gateway.url);
    const headers = {
      host,
      'sec-fetch-site': fetchSite,
      'content-type': contentType
    };
    if (origin !== null) headers.origin = origin;
    if (cookie) headers.cookie = cookie;
    if (csrf) headers['x-csrf-token'] = csrf;
    if (nonce) headers['x-request-nonce'] = nonce;
    if (body !== undefined) headers['content-length'] = Buffer.byteLength(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: url.port,
      path,
      method,
      headers
    }, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { text += chunk; });
      response.on('end', () => {
        let json = null;
        try { json = JSON.parse(text); } catch {}
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: json,
          text
        });
      });
    });
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

async function setup(t, options = {}) {
  let now = options.now ?? NOW;
  const trusted = createAuthority(options);
  const gatewayService = createLocalCpuConsentGateway({
    enabled: true,
    authority: trusted.authority,
    now: () => now,
    sessionTtlMs: options.sessionTtlMs ?? 60_000
  });
  const gateway = await gatewayService.start();
  t.after(() => gatewayService.close());
  const opened = await request(gateway);
  assert.equal(opened.status, 201);
  const cookie = opened.headers['set-cookie']?.[0]?.split(';')[0];
  assert.ok(cookie);
  const session = {
    cookie,
    csrf: opened.body.csrfToken,
    nonce: opened.body.requestNonce
  };
  async function consent(body = {proposalId: PROPOSAL_ID, expectedRevision: REVISION}, extra = {}) {
    const response = await request(gateway, {
      path: '/v1/consent',
      cookie: session.cookie,
      csrf: extra.csrf ?? session.csrf,
      nonce: extra.nonce ?? session.nonce,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...extra
    });
    if (response.headers['x-csrf-token']) {
      session.csrf = response.headers['x-csrf-token'];
      session.nonce = response.headers['x-request-nonce'];
    }
    return response;
  }
  return {
    gateway,
    session,
    consent,
    trusted,
    setNow(value) { now = value; }
  };
}

test('default-off gateway allocates no session and never calls authority', async () => {
  const trusted = createAuthority();
  const gateway = createLocalCpuConsentGateway({authority: trusted.authority});
  assert.equal(gateway.enabled, false);
  await assert.rejects(gateway.start(), /disabled/);
  await gateway.close();
  assert.deepEqual(trusted.calls, []);
});

test('gateway binds only loopback and publishes no authority credentials', async t => {
  const trusted = createAuthority();
  const service = createLocalCpuConsentGateway({enabled: true, authority: trusted.authority});
  const gateway = await service.start();
  t.after(() => service.close());
  assert.deepEqual({
    host: gateway.host,
    url: gateway.url,
    sessionPath: gateway.sessionPath,
    consentPath: gateway.consentPath
  }, {
    host: '127.0.0.1',
    url: `http://localhost:${gateway.port}`,
    sessionPath: '/v1/session',
    consentPath: '/v1/consent'
  });
  assert.doesNotMatch(JSON.stringify(gateway), /apiToken|privateKey|databasePath|sqlite/i);
});

test('session bootstrap rejects non-empty JSON bodies', async t => {
  const trusted = createAuthority();
  const service = createLocalCpuConsentGateway({enabled: true, authority: trusted.authority});
  const gateway = await service.start();
  t.after(() => service.close());
  for (const body of ['null', '{}', '[]']) {
    const response = await request(gateway, {body});
    assert.equal(response.status, 400);
    assert.equal(response.body.error, 'session-request-must-be-empty');
  }
  const invalidMediaType = await request(gateway, {contentType: 'application/json-bad'});
  assert.equal(invalidMediaType.status, 415);
  assert.deepEqual(trusted.calls, []);
});

test('session cookie is server-controlled and browser sessions receive rotating anti-replay tokens', async t => {
  const {gateway, session, consent, trusted} = await setup(t);
  const opened = await request(gateway, {path: '/v1/session'});
  assert.equal(opened.status, 201);
  assert.match(opened.headers['set-cookie'][0], /HttpOnly/);
  assert.match(opened.headers['set-cookie'][0], /Secure/);
  assert.match(opened.headers['set-cookie'][0], /SameSite=Strict/);
  assert.match(opened.headers['set-cookie'][0], /Path=\//);
  const response = await consent();
  assert.equal(response.status, 200);
  assert.equal(response.body.schema, 'hlm-local-cpu-consent-v1');
  assert.equal(response.body.signature, 'A'.repeat(86));
  assert.equal(trusted.calls.length, 1);
  assert.equal(trusted.calls[0][0], PROPOSAL_ID);
  assert.equal(trusted.calls[0][1], REVISION);
  assert.equal(typeof trusted.calls[0][2].signal?.aborted, 'boolean');
  assert.match(session.cookie, /^__Host-hlm_exp_cpu_session=[A-Za-z0-9_-]{43}$/);
  assert.match(response.headers['x-csrf-token'], /^[A-Za-z0-9_-]{43}$/);
  assert.match(response.headers['x-request-nonce'], /^[A-Za-z0-9_-]{43}$/);
  assert.equal(response.headers['access-control-allow-origin'], undefined);
  assert.doesNotMatch(response.text, /privateKey|apiToken|databasePath|sqlite/i);
  assert.equal(gateway.host, '127.0.0.1');
});

test('public GitHub Pages origins, hostile origins, missing origin and DNS-rebinding Host fail closed', async t => {
  const {gateway, session, trusted} = await setup(t);
  const cases = [
    {origin: 'https://jduns001-sudo.github.io', status: 403},
    {origin: 'https://attacker.example', status: 403},
    {origin: null, status: 403},
    {host: 'attacker.example', status: 421},
    {host: '127.0.0.1.evil.example', status: 421},
    {fetchSite: 'cross-site', status: 403}
  ];
  for (const item of cases) {
    const {status: expected, ...requestOptions} = item;
    const response = await request(gateway, {...requestOptions, path: '/v1/session'});
    assert.equal(response.status, expected);
  }
  const publicPageAttempt = await request(gateway, {
    path: '/v1/consent',
    origin: 'https://jduns001-sudo.github.io',
    cookie: session.cookie,
    csrf: session.csrf,
    nonce: session.nonce,
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  assert.equal(publicPageAttempt.status, 403);
  assert.deepEqual(trusted.calls, []);
});

test('consent requires browser session, exact CSRF token and one-time request nonce', async t => {
  const {gateway, session, trusted} = await setup(t);
  const noSession = await request(gateway, {
    path: '/v1/consent',
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  assert.equal(noSession.status, 401);

  const invalidCsrf = await request(gateway, {
    path: '/v1/consent',
    cookie: session.cookie,
    csrf: 'wrong-token',
    nonce: session.nonce,
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  assert.equal(invalidCsrf.status, 403);

  const attempts = await Promise.all(Array.from({length: 2}, () => request(gateway, {
    path: '/v1/consent',
    cookie: session.cookie,
    csrf: session.csrf,
    nonce: session.nonce,
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  })));
  assert.deepEqual(attempts.map(attempt => attempt.status).sort(), [200, 403]);
  assert.equal(attempts.find(attempt => attempt.status === 403).body.error,
    'invalid-or-replayed-request-token');
  assert.equal(trusted.calls.length, 1);
});

test('bridge endpoint requires the same session and reviews only server-resolved proposal data', async t => {
  const trusted = createAuthority();
  const state = {trusted: true};
  const proposal = {outgoingPlayerId: 'server-player-a'};
  let reviewArgs;
  const gatewayService = createLocalCpuConsentGateway({
    enabled: true,
    authority: trusted.authority,
    bridge: {
      async review(...args) {
        reviewArgs = args;
        return {
          status: 'receiving-consent-record-bridged',
          decision: {eligible: true},
          record: {decision: 'accepted', signature: 'verified-by-bridge'},
          saved: false,
          settlementAuthorized: false,
          independentlyAuthenticated: true,
          experimental: true
        };
      }
    },
    resolveAuthoritativeProposal(proposalId, stateRevision) {
      return proposalId === PROPOSAL_ID && stateRevision === REVISION
        ? {state, proposal, stateRevision}
        : null;
    }
  });
  const gateway = await gatewayService.start();
  t.after(() => gatewayService.close());
  const envelopeValue = envelope();

  const unauthenticated = await request(gateway, {
    path: '/v1/bridge',
    body: JSON.stringify({envelope: envelopeValue})
  });
  assert.equal(unauthenticated.status, 401);

  const opened = await request(gateway);
  const session = {
    cookie: opened.headers['set-cookie'][0].split(';')[0],
    csrf: opened.body.csrfToken,
    nonce: opened.body.requestNonce
  };
  const untrustedSnapshot = await request(gateway, {
    path: '/v1/bridge',
    cookie: session.cookie,
    csrf: session.csrf,
    nonce: session.nonce,
    body: JSON.stringify({envelope: envelopeValue, state: {forged: true}})
  });
  assert.equal(untrustedSnapshot.status, 400);
  assert.equal(reviewArgs, undefined);

  const bridged = await request(gateway, {
    path: '/v1/bridge',
    cookie: session.cookie,
    csrf: untrustedSnapshot.headers['x-csrf-token'],
    nonce: untrustedSnapshot.headers['x-request-nonce'],
    body: JSON.stringify({envelope: envelopeValue})
  });
  assert.equal(bridged.status, 200);
  assert.deepEqual(reviewArgs.slice(0, 3), [state, proposal, REVISION]);
  assert.equal(bridged.body.saved, false);
  assert.equal(bridged.body.settlementAuthorized, false);
});

test('session expiry and expired or wrongly bound authority consent are rejected', async t => {
  const expiredConsent = envelope(PROPOSAL_ID, REVISION, {
    expiresAt: new Date(NOW).toISOString()
  });
  const expired = await setup(t, {body: expiredConsent});
  const expiredResponse = await expired.consent();
  assert.equal(expiredResponse.status, 410);
  assert.equal(expiredResponse.body.error, 'consent-expired');

  const wrongRevision = await setup(t, {
    body: envelope(PROPOSAL_ID, 'another-revision')
  });
  const bindingResponse = await wrongRevision.consent();
  assert.equal(bindingResponse.status, 503);
  assert.equal(bindingResponse.body.error, 'authority-service-failure');

  const sessionExpiry = await setup(t, {sessionTtlMs: 1000});
  sessionExpiry.setNow(NOW + 1001);
  const sessionResponse = await sessionExpiry.consent();
  assert.equal(sessionResponse.status, 401);
  assert.equal(sessionResponse.body.error, 'browser-session-required');
  assert.deepEqual(sessionExpiry.trusted.calls, []);
});

test('malformed bodies, extra fields, oversized requests and media types fail before authority', async t => {
  const opened = await setup(t);
  const {gateway, session, trusted} = opened;

  const malformed = await opened.consent('{');
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error, 'malformed-json');

  const extraField = await opened.consent({
    proposalId: PROPOSAL_ID,
    expectedRevision: REVISION,
    bearerToken: 'must-not-pass'
  });
  assert.equal(extraField.status, 400);

  const invalidIdentifier = await opened.consent({
    proposalId: 'x'.repeat(129),
    expectedRevision: REVISION
  });
  assert.equal(invalidIdentifier.status, 400);

  const unsupportedType = await opened.consent('{}', {contentType: 'text/plain'});
  assert.equal(unsupportedType.status, 415);

  const oversized = await opened.consent(' '.repeat(9000));
  assert.equal(oversized.status, 413);
  assert.deepEqual(trusted.calls, []);
});

test('authority output is allow-listed and service failures are sanitized', async t => {
  const withSecrets = envelope(PROPOSAL_ID, REVISION, {
    privateKey: 'not-for-browser',
    apiToken: 'never-forward'
  });
  const clean = await setup(t, {body: withSecrets});
  const cleanResponse = await clean.consent();
  assert.equal(cleanResponse.status, 200);
  assert.equal(cleanResponse.body.privateKey, undefined);
  assert.equal(cleanResponse.body.apiToken, undefined);

  const serviceFailure = await setup(t, {
    statusCode: 503,
    body: {error: 'authority-down', privateKey: 'sensitive'}
  });
  const failure = await serviceFailure.consent();
  assert.equal(failure.status, 503);
  assert.deepEqual(failure.body, {error: 'authority-down'});
  assert.doesNotMatch(failure.text, /sensitive|privateKey/);
});
