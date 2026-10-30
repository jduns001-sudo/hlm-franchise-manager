'use strict';
const {createExperimentalTradeCoordinator} =
  require('./hlm-phase11-experimental-trade-coordinator');
const {createLocalCpuConsentGateway} =
  require('./hlm-phase11-local-cpu-consent-gateway');

const DEVELOPMENT_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Local experimental CPU trade harness</title></head>
<body><main><h1>Local experimental CPU trade harness</h1>
<p>Local-only development endpoint. No production save or public Pages integration.</p>
<p>This endpoint does not execute trade or settlement code in the browser.</p></main></body></html>`;

function createLocalCpuTradeDevelopmentHarness({
  enabled = false,
  authority,
  bridge,
  resolveAuthoritativeProposal,
  now,
  sessionTtlMs
} = {}) {
  if (enabled !== true && enabled !== false) throw new TypeError('Invalid development harness flag');
  if (!enabled) {
    return Object.freeze({
      enabled: false,
      async start() { throw new Error('Local CPU trade development harness is disabled'); },
      async createCoordinator() {
        throw new Error('Local CPU trade development harness is disabled');
      },
      async close() {}
    });
  }

  const gateway = createLocalCpuConsentGateway({
    enabled: true,
    authority,
    bridge,
    resolveAuthoritativeProposal,
    developmentPage: DEVELOPMENT_PAGE,
    ...(now ? {now} : {}),
    ...(sessionTtlMs ? {sessionTtlMs} : {})
  });
  let endpoint = null;
  let closed = false;

  async function start(options) {
    if (closed) throw new Error('Local CPU trade development harness is closed');
    if (endpoint) throw new Error('Local CPU trade development harness is already listening');
    endpoint = await gateway.start(options);
    return endpoint;
  }

  async function createCoordinator({repository, key, consentVerifier, now: coordinatorClock} = {}) {
    if (closed || !endpoint) throw new Error('Local CPU trade development harness is not running');
    const transportUrl = endpoint.url.replace('localhost', '127.0.0.1');
    const sessionResponse = await fetch(`${transportUrl}/v1/session`, {
      method: 'POST',
      headers: {
        origin: endpoint.url,
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json'
      }
    });
    const sessionBody = await sessionResponse.json();
    if (sessionResponse.status !== 201) throw new Error('Local browser session could not be created');
    const cookieHeader = sessionResponse.headers.get('set-cookie');
    const cookie = cookieHeader?.split(';', 1)[0];
    if (!cookie) throw new Error('Local browser session cookie unavailable');
    let csrfToken = sessionBody.csrfToken;
    let requestNonce = sessionBody.requestNonce;

    async function post(path, body) {
      const response = await fetch(`${transportUrl}${path}`, {
        method: 'POST',
        headers: {
          origin: endpoint.url,
          'sec-fetch-site': 'same-origin',
          'content-type': 'application/json',
          cookie,
          'x-csrf-token': csrfToken,
          'x-request-nonce': requestNonce
        },
        body: JSON.stringify(body)
      });
      csrfToken = response.headers.get('x-csrf-token') || csrfToken;
      requestNonce = response.headers.get('x-request-nonce') || requestNonce;
      return {statusCode: response.status, body: await response.json()};
    }

    return createExperimentalTradeCoordinator({
      enabled: true,
      repository,
      key,
      consentVerifier,
      now: coordinatorClock,
      authority: {
        async issueConsent(proposalId, expectedRevision) {
          return post('/v1/consent', {proposalId, expectedRevision});
        }
      },
      bridge: {
        async review(_state, _proposal, _revision, envelope) {
          const result = await post('/v1/bridge', {envelope});
          return result.statusCode === 200
            ? result.body
            : {code: result.body?.error || 'receiving-consent-bridge-rejected'};
        }
      }
    });
  }

  async function close() {
    if (closed) return;
    closed = true;
    endpoint = null;
    await gateway.close();
  }

  return Object.freeze({
    enabled: true,
    start,
    createCoordinator,
    close
  });
}

module.exports = {createLocalCpuTradeDevelopmentHarness};
