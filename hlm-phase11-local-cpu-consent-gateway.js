'use strict';
const crypto = require('node:crypto');
const http = require('node:http');

const SESSION_PATH = '/v1/session';
const CONSENT_PATH = '/v1/consent';
const BRIDGE_PATH = '/v1/bridge';
const SESSION_COOKIE = '__Host-hlm_exp_cpu_session';
const DEFAULT_SESSION_TTL_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 8192;
const MAX_SESSIONS = 32;
const ENVELOPE_FIELDS = [
  'version',
  'schema',
  'decisionId',
  'proposalId',
  'proposalDigest',
  'digestSchema',
  'controlledTeamId',
  'teamId',
  'teamIds',
  'stateRevision',
  'issuedAt',
  'expiresAt',
  'keyId',
  'decision',
  'cpuDecision',
  'signature'
];

function isLoopback(address) {
  return address === '127.0.0.1' || address === '::ffff:127.0.0.1';
}

function headerValues(request, name) {
  const values = [];
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index].toLowerCase() === name) {
      values.push(request.rawHeaders[index + 1]);
    }
  }
  return values;
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && crypto.timingSafeEqual(leftBytes, rightBytes);
}

function responseHeaders() {
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
    'x-frame-options': 'DENY',
    'cross-origin-resource-policy': 'same-origin',
    vary: 'Origin'
  };
}

function readJsonBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let oversized = false;
    const chunks = [];
    request.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        oversized = true;
        chunks.length = 0;
      } else if (!oversized) {
        chunks.push(chunk);
      }
    });
    request.on('error', reject);
    request.on('aborted', () => reject(Object.assign(new Error('Request aborted'), {statusCode: 400})));
    request.on('end', () => {
      if (oversized) {
        reject(Object.assign(new Error('Request body too large'), {statusCode: 413}));
        return;
      }
      if (size === 0) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Valid JSON request required'), {statusCode: 400}));
      }
    });
  });
}

function isJsonContentType(request) {
  return request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase() ===
    'application/json';
}

function validEnvelopeResult(result, proposalId, expectedRevision) {
  const envelope = result?.body;
  if (result?.statusCode !== 200 || !envelope || typeof envelope !== 'object' ||
      Array.isArray(envelope) ||
      ENVELOPE_FIELDS.some(field => !Object.hasOwn(envelope, field)) ||
      envelope.version !== 1 ||
      envelope.schema !== 'hlm-local-cpu-consent-v1' ||
      !['approve', 'decline'].includes(envelope.decision) ||
      !['accepted', 'declined'].includes(envelope.cpuDecision) ||
      envelope.decision !== (envelope.cpuDecision === 'accepted' ? 'approve' : 'decline') ||
      envelope.proposalId !== proposalId || envelope.stateRevision !== expectedRevision ||
      !Array.isArray(envelope.teamIds) || envelope.teamIds.length !== 2 ||
      envelope.teamIds.some(teamId => typeof teamId !== 'string' || !teamId) ||
      envelope.teamIds[0] === envelope.teamIds[1] ||
      !envelope.teamIds.includes(envelope.controlledTeamId) ||
      !envelope.teamIds.includes(envelope.teamId) ||
      envelope.controlledTeamId === envelope.teamId ||
      ENVELOPE_FIELDS.filter(field => field !== 'version' && field !== 'teamIds')
        .some(field => typeof envelope[field] !== 'string' || !envelope[field])) {
    return false;
  }
  return /^[a-f0-9]{64}$/.test(envelope.proposalDigest) &&
    /^[a-f0-9]{24}$/.test(envelope.keyId) &&
    /^[A-Za-z0-9_-]{80,100}$/.test(envelope.signature) &&
    envelope.digestSchema === 'hlm-trade-proposal-digest-v1';
}

function createLocalCpuConsentGateway({
  enabled = false,
  authority,
  bridge,
  resolveAuthoritativeProposal,
  developmentPage,
  now = () => Date.now(),
  sessionTtlMs = DEFAULT_SESSION_TTL_MS,
  maxBodyBytes = MAX_BODY_BYTES,
  maxSessions = MAX_SESSIONS
} = {}) {
  if (enabled !== true && enabled !== false) throw new TypeError('Invalid gateway enable flag');
  if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs < 1000 ||
      sessionTtlMs > 15 * 60 * 1000) {
    throw new TypeError('Browser session lifetime must be between 1 second and 15 minutes');
  }
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 128 || maxBodyBytes > MAX_BODY_BYTES ||
      !Number.isSafeInteger(maxSessions) || maxSessions < 1 || maxSessions > MAX_SESSIONS) {
    throw new TypeError('Invalid gateway resource limits');
  }
  if (typeof now !== 'function') throw new TypeError('Gateway clock function required');
  if (enabled && (!authority || typeof authority.issueConsent !== 'function')) {
    throw new TypeError('Trusted server-side consent authority required');
  }
  if ((bridge && typeof bridge.review !== 'function') ||
      (resolveAuthoritativeProposal && typeof resolveAuthoritativeProposal !== 'function') ||
      Boolean(bridge) !== Boolean(resolveAuthoritativeProposal)) {
    throw new TypeError('Bridge review and authoritative proposal resolver must be configured together');
  }
  if (developmentPage !== undefined && typeof developmentPage !== 'string') {
    throw new TypeError('Development page must be trusted HTML text');
  }

  if (!enabled) {
    return Object.freeze({
      enabled: false,
      async start() { throw new Error('Experimental CPU consent gateway is disabled'); },
      async close() {}
    });
  }

  const sessions = new Map();
  let server = null;
  let closed = false;
  let origin = null;
  let host = null;
  let loopbackHost = null;

  function timestamp() {
    const value = now();
    const result = value instanceof Date ? value.getTime() : Number(value);
    if (!Number.isFinite(result)) throw new Error('Gateway clock returned invalid time');
    return result;
  }

  function send(response, statusCode, body, session) {
    const headers = responseHeaders();
    if (session) {
      headers['x-csrf-token'] = session.csrf;
      headers['x-request-nonce'] = session.nonce;
    }
    response.writeHead(statusCode, headers);
    response.end(JSON.stringify(body));
  }

  function rejectRequest(response, statusCode, error) {
    send(response, statusCode, {error});
  }

  function requestOriginAllowed(request) {
    const values = headerValues(request, 'origin');
    return values.length === 1 && values[0] === origin &&
      (!request.headers['sec-fetch-site'] || request.headers['sec-fetch-site'] === 'same-origin') &&
      (!request.headers['sec-fetch-mode'] ||
        ['cors', 'same-origin'].includes(request.headers['sec-fetch-mode']));
  }

  function requestHostAllowed(request) {
    const values = headerValues(request, 'host');
    return values.length === 1 && (values[0] === host || values[0] === loopbackHost) &&
      isLoopback(request.socket.remoteAddress);
  }

  function cookieSession(request) {
    const cookieHeaders = headerValues(request, 'cookie');
    if (cookieHeaders.length !== 1) return null;
    const matches = cookieHeaders[0].split(';').map(value => value.trim())
      .filter(value => value.startsWith(`${SESSION_COOKIE}=`));
    if (matches.length !== 1) return null;
    const id = matches[0].slice(SESSION_COOKIE.length + 1);
    if (!/^[A-Za-z0-9_-]{43}$/.test(id)) return null;
    const session = sessions.get(id);
    if (!session) return null;
    if (session.expiresAt <= timestamp()) {
      sessions.delete(id);
      return null;
    }
    return {id, session};
  }

  function makeSessionCookie(id) {
    return `${SESSION_COOKIE}=${id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}`;
  }

  function parseSessionTokens(request, session) {
    const csrfHeaders = headerValues(request, 'x-csrf-token');
    const nonceHeaders = headerValues(request, 'x-request-nonce');
    if (csrfHeaders.length !== 1 || nonceHeaders.length !== 1 ||
        !safeEqual(csrfHeaders[0], session.csrf) ||
        !safeEqual(nonceHeaders[0], session.nonce)) return false;
    session.csrf = crypto.randomBytes(32).toString('base64url');
    session.nonce = crypto.randomBytes(32).toString('base64url');
    return true;
  }

  async function handle(request, response) {
    if (!requestHostAllowed(request)) return rejectRequest(response, 421, 'invalid-host');
    if (request.method === 'GET' && request.url === '/' && developmentPage !== undefined) {
      if ((request.headers['sec-fetch-site'] &&
          !['same-origin', 'none'].includes(request.headers['sec-fetch-site'])) ||
          (headerValues(request, 'origin').length &&
            !requestOriginAllowed(request))) {
        return rejectRequest(response, 403, 'cross-site-page-request-rejected');
      }
      response.writeHead(200, {
        ...responseHeaders(),
        'content-security-policy': "default-src 'none'; connect-src 'self'; frame-ancestors 'none'",
        'content-type': 'text/html; charset=utf-8'
      });
      response.end(developmentPage);
      return;
    }
    if (!requestOriginAllowed(request)) return rejectRequest(response, 403, 'invalid-origin');
    if (request.method !== 'POST' ||
        ![SESSION_PATH, CONSENT_PATH, BRIDGE_PATH].includes(request.url)) {
      return rejectRequest(response, 404, 'not-found');
    }
    if (request.headers['sec-fetch-site'] !== undefined &&
        request.headers['sec-fetch-site'] !== 'same-origin') {
      return rejectRequest(response, 403, 'cross-site-request-rejected');
    }

    if (request.url === SESSION_PATH) {
      if (!isJsonContentType(request)) {
        return rejectRequest(response, 415, 'application-json-required');
      }
      let body;
      try {
        body = await readJsonBody(request, maxBodyBytes);
      } catch (error) {
        return rejectRequest(response, error.statusCode || 400, 'invalid-session-request');
      }
      if (body !== undefined) return rejectRequest(response, 400, 'session-request-must-be-empty');
      for (const [id, session] of sessions) {
        if (session.expiresAt <= timestamp()) sessions.delete(id);
      }
      if (sessions.size >= maxSessions) return rejectRequest(response, 429, 'session-limit-reached');
      const id = crypto.randomBytes(32).toString('base64url');
      const session = {
        csrf: crypto.randomBytes(32).toString('base64url'),
        nonce: crypto.randomBytes(32).toString('base64url'),
        expiresAt: timestamp() + sessionTtlMs
      };
      sessions.set(id, session);
      response.setHeader('set-cookie', makeSessionCookie(id));
      return send(response, 201, {
        expiresAt: new Date(session.expiresAt).toISOString(),
        csrfToken: session.csrf,
        requestNonce: session.nonce
      });
    }

    if (request.url === BRIDGE_PATH && !bridge) {
      return rejectRequest(response, 404, 'not-found');
    }

    const authenticated = cookieSession(request);
    if (!authenticated) return rejectRequest(response, 401, 'browser-session-required');
    const {session} = authenticated;
    if (!parseSessionTokens(request, session)) {
      return rejectRequest(response, 403, 'invalid-or-replayed-request-token');
    }
    if (!isJsonContentType(request)) {
      return send(response, 415, {error: 'application-json-required'}, session);
    }

    let body;
    try {
      body = await readJsonBody(request, maxBodyBytes);
    } catch (error) {
      return send(response, error.statusCode || 400, {
        error: error.statusCode === 413 ? 'request-body-too-large' : 'malformed-json'
      }, session);
    }
    const controller = new AbortController();
    request.on('aborted', () => controller.abort());
    response.on('close', () => {
      if (!response.writableEnded) controller.abort();
    });
    try {
      if (request.url === CONSENT_PATH) {
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            Object.keys(body).sort().join(',') !== 'expectedRevision,proposalId' ||
            typeof body.proposalId !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(body.proposalId) ||
            typeof body.expectedRevision !== 'string' ||
            !/^[A-Za-z0-9._:-]{1,256}$/.test(body.expectedRevision)) {
          return send(response, 400, {error: 'invalid-consent-request'}, session);
        }
        const result = await authority.issueConsent(body.proposalId, body.expectedRevision, {
          signal: controller.signal
        });
        if (controller.signal.aborted || response.destroyed) return;
        if (result?.statusCode === 499) return;
        if (validEnvelopeResult(result, body.proposalId, body.expectedRevision)) {
          const issuedAt = Date.parse(result.body.issuedAt);
          const expiresAt = Date.parse(result.body.expiresAt);
          const nowMs = timestamp();
          if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) ||
              expiresAt <= issuedAt || nowMs < issuedAt) {
            return send(response, 503, {error: 'authority-service-failure'}, session);
          }
          if (nowMs >= expiresAt) {
            return send(response, 410, {error: 'consent-expired'}, session);
          }
          const envelope = Object.fromEntries(ENVELOPE_FIELDS.map(field =>
            [field, result.body[field]]));
          return send(response, 200, envelope, session);
        }
        const status = [400, 404, 409, 410, 429, 503].includes(result?.statusCode)
          ? result.statusCode
          : 503;
        const error = typeof result?.body?.error === 'string' &&
          /^[a-z0-9-]{1,80}$/.test(result.body.error)
          ? result.body.error
          : 'authority-service-failure';
        return send(response, status, {error}, session);
      }

      if (!body || typeof body !== 'object' || Array.isArray(body) ||
          Object.keys(body).join(',') !== 'envelope' ||
          !body.envelope || typeof body.envelope !== 'object' ||
          Array.isArray(body.envelope) ||
          typeof body.envelope.proposalId !== 'string' ||
          typeof body.envelope.stateRevision !== 'string') {
        return send(response, 400, {error: 'invalid-bridge-request'}, session);
      }
      const authoritative = await resolveAuthoritativeProposal(
        body.envelope.proposalId, body.envelope.stateRevision
      );
      if (!authoritative || authoritative.stateRevision !== body.envelope.stateRevision ||
          !authoritative.state || !authoritative.proposal) {
        return send(response, 409, {error: 'stale-authoritative-revision'}, session);
      }
      const result = await bridge.review(
        authoritative.state,
        authoritative.proposal,
        authoritative.stateRevision,
        body.envelope,
        {signal: controller.signal}
      );
      if (controller.signal.aborted || response.destroyed) return;
      if (result?.status !== 'receiving-consent-record-bridged' ||
          result.independentlyAuthenticated !== true || !result.record ||
          result.record.decision !== 'accepted') {
        const code = typeof result?.code === 'string' &&
          /^[a-z0-9-]{1,80}$/.test(result.code)
          ? result.code
          : 'receiving-consent-bridge-rejected';
        return send(response, 409, {error: code}, session);
      }
      return send(response, 200, {
        status: result.status,
        decision: result.decision,
        record: result.record,
        saved: false,
        settlementAuthorized: false,
        independentlyAuthenticated: true,
        experimental: true
      }, session);
    } catch {
      if (response.destroyed) return;
      return send(response, 503, {error: 'authority-service-failure'}, session);
    }
  }

  async function start({port = 0} = {}) {
    if (closed) throw new Error('Experimental CPU consent gateway is closed');
    if (server) throw new Error('Experimental CPU consent gateway is already listening');
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new TypeError('Invalid gateway port');
    server = http.createServer((request, response) => {
      handle(request, response).catch(() => {
        if (!response.headersSent) rejectRequest(response, 500, 'gateway-failure');
        else response.destroy();
      });
    });
    server.requestTimeout = 10_000;
    server.headersTimeout = 5_000;
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
    const actualPort = server.address().port;
    host = `localhost:${actualPort}`;
    loopbackHost = `127.0.0.1:${actualPort}`;
    origin = `http://${host}`;
    return Object.freeze({
      url: origin,
      host: '127.0.0.1',
      port: actualPort,
      sessionPath: SESSION_PATH,
      consentPath: CONSENT_PATH,
      bridgePath: bridge ? BRIDGE_PATH : null
    });
  }

  async function close() {
    if (closed) return;
    closed = true;
    sessions.clear();
    if (server?.listening) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
  }

  return Object.freeze({enabled: true, start, close});
}

module.exports = {createLocalCpuConsentGateway};
