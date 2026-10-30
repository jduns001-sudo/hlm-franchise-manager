'use strict';
/* Mission 1473: loopback-only CPU consent authority proof of concept. */
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {DatabaseSync} = require('node:sqlite');
const {evaluateTradeEligibility} = require('./hlm-phase11-trade-financial-eligibility');
const {evaluateTradeRestrictions} = require('./hlm-phase11-trade-restrictions');
const {DIGEST_SCHEMA, canonicalProposalDigestInput} = require('./hlm-phase11-trade-proposal-digest');

const SCHEMA = 'hlm-local-cpu-consent-v1';
const ENDPOINT = '/v1/consent';
const MAX_BODY_BYTES = 8192;
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const PRODUCTION_DATABASE_NAME = 'hlm_front_office_v8';

function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  throw new TypeError('Canonical JSON-compatible data required');
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

// proposalId is accepted for compatibility but is not part of the shared versioned digest.
function canonicalTradeDigest({stateRevision, controlledTeamId, receivingTeamId, proposal}) {
  return crypto.createHash('sha256').update(canonicalProposalDigestInput({
    stateRevision, controlledTeamId, receivingTeamId, proposal
  })).digest('hex');
}

function validatePicks(state, proposal, otherTeamId) {
  if (!Array.isArray(proposal.picks) || proposal.picks.length === 0) {
    throw new TypeError('At least one authoritative draft-pick transfer is required');
  }
  const controlled = String(state.meta.controlledTeamId);
  const ids = new Set();
  const rights = new Set();
  const keyOf = pick => [String(pick.year), String(pick.round), String(pick.originalTeamId)].join(':');

  for (const transfer of proposal.picks) {
    if (!transfer || typeof transfer !== 'object' || Array.isArray(transfer)) {
      throw new TypeError('Invalid draft-pick transfer');
    }
    const pickId = String(transfer.pickId ?? '');
    const from = String(transfer.fromTeamId ?? '');
    const to = String(transfer.toTeamId ?? '');
    if (!pickId || from === to ||
        ![controlled, otherTeamId].includes(from) ||
        ![controlled, otherTeamId].includes(to)) {
      throw new TypeError('Invalid draft-pick teams or identifier');
    }
    if (ids.has(pickId)) throw new TypeError('Duplicate draft-pick transfer');
    ids.add(pickId);
    const found = state.assets.draftPicks.filter(pick => String(pick.id) === pickId);
    if (found.length !== 1) throw new TypeError('Draft pick missing or ambiguous');
    const pick = found[0];
    if (!Number.isInteger(pick.year) || pick.year < 2000 ||
        !Number.isInteger(pick.round) || pick.round < 1 ||
        pick.originalTeamId === undefined || pick.originalTeamId === null ||
        String(pick.teamId) !== from) {
      throw new TypeError('Draft-pick source ownership or rights are invalid');
    }
    const right = keyOf(pick);
    if (rights.has(right) || state.assets.draftPicks.filter(row => keyOf(row) === right).length !== 1) {
      throw new TypeError('Draft rights are duplicated or ambiguous');
    }
    if (!state.universe.teams.some(team => String(team.id) === String(pick.originalTeamId))) {
      throw new TypeError('Draft-pick original team is missing');
    }
    rights.add(right);
  }
}

function validateProposal(state, proposal) {
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal) ||
      Object.keys(proposal).sort().join(',') !== 'incomingPlayerId,outgoingPlayerId,picks') {
    throw new TypeError('Proposal must contain only outgoingPlayerId, incomingPlayerId, and picks');
  }
  const args = {
    outgoingPlayerId: proposal.outgoingPlayerId,
    incomingPlayerId: proposal.incomingPlayerId,
    controlledTeamId: state.meta?.controlledTeamId
  };
  const financial = evaluateTradeEligibility(state, args);
  const restrictions = evaluateTradeRestrictions(state, args);
  if (financial.eligibleForFurtherReview !== true || restrictions.eligibleForFurtherReview !== true) {
    throw new TypeError('Source-backed player trade checks failed');
  }
  validatePicks(state, proposal, String(financial.otherTeamId));
  return {
    controlledTeamId: String(state.meta.controlledTeamId),
    receivingTeamId: String(financial.otherTeamId)
  };
}

function assertPrivateFile(filePath) {
  const stats = fs.lstatSync(filePath);
  if (!stats.isFile() || stats.isSymbolicLink() || (stats.mode & 0o077) !== 0 ||
      (typeof process.getuid === 'function' && stats.uid !== process.getuid())) {
    throw new Error('Signing key and local consent database files must be private (mode 0600)');
  }
}

function ensurePrivateDirectory(directory) {
  fs.mkdirSync(directory, {recursive: true, mode: 0o700});
  const stats = fs.statSync(directory);
  if (!stats.isDirectory() || (stats.mode & 0o077) !== 0 ||
      (typeof process.getuid === 'function' && stats.uid !== process.getuid())) {
    throw new Error('Local consent authority directory must be private (mode 0700)');
  }
}

function loadOrCreateKeyPair(privateKeyPath) {
  ensurePrivateDirectory(path.dirname(privateKeyPath));
  try {
    assertPrivateFile(privateKeyPath);
    const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
    if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Ed25519 signing key required');
    return {privateKey, publicKey: crypto.createPublicKey(privateKey)};
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const pair = crypto.generateKeyPairSync('ed25519');
  const pem = pair.privateKey.export({type: 'pkcs8', format: 'pem'});
  try {
    fs.writeFileSync(privateKeyPath, pem, {flag: 'wx', mode: 0o600});
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    assertPrivateFile(privateKeyPath);
    const privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
    if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Ed25519 signing key required');
    return {privateKey, publicKey: crypto.createPublicKey(privateKey)};
  }
  assertPrivateFile(privateKeyPath);
  return pair;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let oversized = false;
    const chunks = [];
    request.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        oversized = true;
        chunks.length = 0;
        return;
      }
      if (!oversized) chunks.push(chunk);
    });
    request.on('error', reject);
    request.on('end', () => {
      if (oversized) {
        reject(Object.assign(new Error('Request body too large'), {statusCode: 413}));
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

function createLocalCpuConsentAuthority({
  enabled = false,
  databasePath,
  privateKeyPath,
  policy,
  now = () => new Date(),
  ttlMs = DEFAULT_TTL_MS
} = {}) {
  if (enabled !== false && enabled !== true) throw new TypeError('Invalid authority enable flag');
  if (enabled === false) {
    return Object.freeze({
      enabled: false,
      async start() { throw new Error('Local CPU consent authority is disabled'); },
      registerAuthoritativeProposal() { throw new Error('Local CPU consent authority is disabled'); },
      async close() {}
    });
  }
  if (databasePath === PRODUCTION_DATABASE_NAME || typeof databasePath !== 'string' ||
      !path.isAbsolute(databasePath) || typeof privateKeyPath !== 'string' ||
      !path.isAbsolute(privateKeyPath) || databasePath === privateKeyPath) {
    throw new TypeError('Distinct absolute local database and private-key paths are required');
  }
  if (!policy || typeof policy.evaluate !== 'function') {
    throw new TypeError('Trusted server-side CPU policy interface required');
  }
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > 15 * 60 * 1000) {
    throw new TypeError('Consent expiration must be between 1 second and 15 minutes');
  }
  if (typeof now !== 'function') throw new TypeError('Server clock function required');

  ensurePrivateDirectory(path.dirname(databasePath));
  if (!fs.existsSync(databasePath)) {
    const fd = fs.openSync(databasePath, 'wx', 0o600);
    fs.closeSync(fd);
  }
  assertPrivateFile(databasePath);
  const database = new DatabaseSync(databasePath);
  database.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
  database.exec(fs.readFileSync(path.join(__dirname, 'hlm-phase11-d1-consent-ledger.sql'), 'utf8'));
  database.exec(`
    CREATE TABLE IF NOT EXISTS authoritative_cpu_proposals (
      proposal_id TEXT PRIMARY KEY NOT NULL,
      state_revision TEXT NOT NULL,
      controlled_team_id TEXT NOT NULL,
      receiving_team_id TEXT NOT NULL,
      proposal_digest TEXT NOT NULL,
      state_json TEXT NOT NULL,
      proposal_json TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS consumed_cpu_proposal_revision
      ON consumed_cpu_decisions(proposal_digest, team_id, state_revision);
    CREATE TABLE IF NOT EXISTS issued_cpu_consents (
      proposal_id TEXT NOT NULL,
      state_revision TEXT NOT NULL,
      proposal_digest TEXT NOT NULL,
      envelope_json TEXT NOT NULL,
      PRIMARY KEY (proposal_id, state_revision)
    );
  `);
  const keyPair = loadOrCreateKeyPair(privateKeyPath);
  const privateKeyDer = keyPair.privateKey.export({type: 'pkcs8', format: 'der'});
  const apiToken = crypto.createHmac('sha256', privateKeyDer)
    .update('hlm-local-cpu-consent-api-token-v1').digest('base64url');
  const publicDer = keyPair.publicKey.export({type: 'spki', format: 'der'});
  const keyId = crypto.createHash('sha256').update(publicDer).digest('hex').slice(0, 24);
  let server = null;
  let closed = false;
  const inFlight = new Map();

  function registerAuthoritativeProposal({proposalId, state, proposal, stateRevision} = {}) {
    if (closed) throw new Error('Authority is closed');
    if (typeof proposalId !== 'string' || !proposalId.trim() || proposalId.length > 128 ||
        typeof stateRevision !== 'string' || !stateRevision.trim() || stateRevision.length > 256) {
      throw new TypeError('Authoritative proposal ID and revision required');
    }
    const canonicalState = JSON.parse(canonicalJson(state));
    const canonicalProposal = JSON.parse(canonicalJson(proposal));
    const teams = validateProposal(canonicalState, canonicalProposal);
    const proposalDigest = canonicalTradeDigest({
      stateRevision,
      ...teams,
      proposal: canonicalProposal
    });

    database.exec('BEGIN IMMEDIATE');
    try {
      const priorSource = database.prepare(`
        SELECT state_revision, state_json, proposal_json
        FROM authoritative_cpu_proposals WHERE proposal_id = ?
      `).get(proposalId);
      if (priorSource && priorSource.state_revision === stateRevision &&
          (priorSource.state_json !== canonicalJson(canonicalState) ||
           priorSource.proposal_json !== canonicalJson(canonicalProposal))) {
        throw new Error('Conflicting authoritative binding for proposal revision');
      }
      const priorIssuance = database.prepare(`
        SELECT proposal_digest FROM issued_cpu_consents
        WHERE proposal_id = ? AND state_revision = ?
      `).get(proposalId, stateRevision);
      if (priorIssuance && priorIssuance.proposal_digest !== proposalDigest) {
        throw new Error('Conflicting authoritative binding for issued proposal revision');
      }
      database.prepare(`
        INSERT INTO authoritative_cpu_proposals
          (proposal_id, state_revision, controlled_team_id, receiving_team_id, proposal_digest, state_json, proposal_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(proposal_id) DO UPDATE SET
          state_revision=excluded.state_revision,
          controlled_team_id=excluded.controlled_team_id,
          receiving_team_id=excluded.receiving_team_id,
          proposal_digest=excluded.proposal_digest,
          state_json=excluded.state_json,
          proposal_json=excluded.proposal_json
      `).run(proposalId, stateRevision, teams.controlledTeamId, teams.receivingTeamId,
        proposalDigest, canonicalJson(canonicalState), canonicalJson(canonicalProposal));
      database.prepare(`
        INSERT INTO consent_state_revisions(team_id, state_revision) VALUES (?, ?)
        ON CONFLICT(team_id) DO UPDATE SET state_revision=excluded.state_revision
      `).run(teams.receivingTeamId, stateRevision);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
    return Object.freeze({proposalId, proposalDigest, stateRevision, ...teams});
  }

  function cancelled() {
    return {statusCode: 499, body: {error: 'consent-issuance-cancelled'}};
  }

  function envelopeResponse(record, authoritativeRow) {
    let envelope;
    try {
      envelope = JSON.parse(record.envelope_json);
    } catch {
      return {statusCode: 503, body: {error: 'stored-consent-corrupt'}};
    }
    const {signature, ...payload} = envelope;
    let signatureValid = false;
    try {
      signatureValid = envelope.keyId === keyId &&
        crypto.verify(null, Buffer.from(canonicalJson(payload)), keyPair.publicKey,
          Buffer.from(signature, 'base64url'));
    } catch {}
    if (!signatureValid || envelope.proposalId !== record.proposal_id ||
        envelope.stateRevision !== record.state_revision ||
        envelope.proposalDigest !== record.proposal_digest ||
        envelope.proposalDigest !== authoritativeRow.proposal_digest ||
        envelope.controlledTeamId !== authoritativeRow.controlled_team_id ||
        envelope.teamId !== authoritativeRow.receiving_team_id) {
      return {statusCode: 503, body: {error: 'stored-consent-binding-invalid'}};
    }
    const nowValue = now();
    const nowMs = nowValue instanceof Date ? nowValue.getTime() : Date.parse(nowValue);
    const issuedMs = Date.parse(envelope.issuedAt);
    const expiresMs = Date.parse(envelope.expiresAt);
    if (!Number.isFinite(nowMs) || !Number.isFinite(issuedMs) ||
        !Number.isFinite(expiresMs) || expiresMs <= issuedMs ||
        nowMs < issuedMs || nowMs >= expiresMs) {
      return {statusCode: 410, body: {error: 'consent-expired'}};
    }
    return {statusCode: 200, body: envelope};
  }

  async function issueConsentOnce(proposalId, expectedRevision, signal) {
    if (closed) throw new Error('Authority is closed');
    if (typeof proposalId !== 'string' || !proposalId ||
        typeof expectedRevision !== 'string' || !expectedRevision) {
      return {statusCode: 400, body: {error: 'proposalId and expectedRevision are required'}};
    }
    if (proposalId.length > 128 || expectedRevision.length > 256) {
      return {statusCode: 400, body: {error: 'proposalId or expectedRevision is too long'}};
    }
    if (signal?.aborted) return cancelled();
    const row = database.prepare(
      'SELECT * FROM authoritative_cpu_proposals WHERE proposal_id = ?'
    ).get(proposalId);
    if (!row) return {statusCode: 404, body: {error: 'authoritative-proposal-not-found'}};
    if (row.state_revision !== expectedRevision) {
      return {statusCode: 409, body: {error: 'stale-authoritative-revision'}};
    }
    const currentRevision = database.prepare(`
      SELECT state_revision FROM consent_state_revisions WHERE team_id = ?
    `).get(row.receiving_team_id);
    if (!currentRevision || currentRevision.state_revision !== expectedRevision) {
      return {statusCode: 409, body: {error: 'stale-authoritative-revision'}};
    }
    const priorIssuance = database.prepare(`
      SELECT * FROM issued_cpu_consents WHERE proposal_id = ? AND state_revision = ?
    `).get(proposalId, expectedRevision);
    if (priorIssuance) {
      if (priorIssuance.proposal_digest !== row.proposal_digest) {
        return {statusCode: 409, body: {error: 'conflicting-authoritative-binding'}};
      }
      if (signal?.aborted) return cancelled();
      return envelopeResponse(priorIssuance, row);
    }

    const state = JSON.parse(row.state_json);
    const proposal = JSON.parse(row.proposal_json);
    const decisionId = crypto.randomUUID();
    const context = deepFreeze({
      proposalId,
      proposal: JSON.parse(row.proposal_json),
      state: JSON.parse(row.state_json),
      stateRevision: row.state_revision,
      controlledTeamId: row.controlled_team_id,
      receivingTeamId: row.receiving_team_id,
      proposalDigest: row.proposal_digest
    });
    const cpuDecision = await policy.evaluate(context, {signal});
    if (signal?.aborted) return cancelled();
    if (cpuDecision !== 'accepted' && cpuDecision !== 'declined') {
      throw new Error('Trusted CPU policy must return accepted or declined');
    }
    const issued = now();
    const issuedMs = issued instanceof Date ? issued.getTime() : Date.parse(issued);
    if (!Number.isFinite(issuedMs)) throw new Error('Authority clock returned an invalid time');
    const issuedAt = new Date(issuedMs).toISOString();
    const expiresAt = new Date(issuedMs + ttlMs).toISOString();

    const unsigned = {
      version: 1,
      schema: SCHEMA,
      decisionId,
      proposalId,
      proposalDigest: row.proposal_digest,
      digestSchema: DIGEST_SCHEMA,
      controlledTeamId: row.controlled_team_id,
      teamId: row.receiving_team_id,
      teamIds: [row.controlled_team_id, row.receiving_team_id].sort(),
      stateRevision: row.state_revision,
      issuedAt,
      expiresAt,
      keyId,
      decision: cpuDecision === 'accepted' ? 'approve' : 'decline',
      cpuDecision
    };
    const signature = crypto.sign(null, Buffer.from(canonicalJson(unsigned)), keyPair.privateKey)
      .toString('base64url');
    const envelope = Object.freeze({...unsigned, signature});

    if (signal?.aborted) return cancelled();
    let transactionOpen = false;
    try {
      database.exec('BEGIN IMMEDIATE');
      transactionOpen = true;
      if (signal?.aborted) {
        database.exec('ROLLBACK');
        transactionOpen = false;
        return cancelled();
      }
      const current = database.prepare(
        'SELECT * FROM authoritative_cpu_proposals WHERE proposal_id = ?'
      ).get(proposalId);
      if (!current || current.state_revision !== expectedRevision) {
        database.exec('ROLLBACK');
        transactionOpen = false;
        return {statusCode: 409, body: {error: 'stale-authoritative-revision'}};
      }
      const currentTeamRevision = database.prepare(`
        SELECT state_revision FROM consent_state_revisions WHERE team_id = ?
      `).get(current.receiving_team_id);
      if (!currentTeamRevision || currentTeamRevision.state_revision !== expectedRevision) {
        database.exec('ROLLBACK');
        transactionOpen = false;
        return {statusCode: 409, body: {error: 'stale-authoritative-revision'}};
      }
      if (current.proposal_digest !== row.proposal_digest ||
          current.receiving_team_id !== row.receiving_team_id ||
          current.controlled_team_id !== row.controlled_team_id) {
        database.exec('ROLLBACK');
        transactionOpen = false;
        return {statusCode: 409, body: {error: 'conflicting-authoritative-binding'}};
      }

      const winner = database.prepare(`
        SELECT * FROM issued_cpu_consents WHERE proposal_id = ? AND state_revision = ?
      `).get(proposalId, expectedRevision);
      if (winner) {
        database.exec('ROLLBACK');
        transactionOpen = false;
        return envelopeResponse(winner, current);
      }
      const consumed = database.prepare(`
        SELECT decision_id FROM consumed_cpu_decisions
        WHERE proposal_digest = ? AND team_id = ? AND state_revision = ?
      `).get(row.proposal_digest, row.receiving_team_id, expectedRevision);
      if (consumed) {
        database.exec('ROLLBACK');
        transactionOpen = false;
        return {statusCode: 409, body: {error: 'consent-already-consumed-without-recoverable-envelope'}};
      }

      const consumedResult = database.prepare(`
        INSERT INTO consumed_cpu_decisions
          (decision_id, proposal_digest, team_id, state_revision)
        SELECT ?, ?, ?, ? WHERE EXISTS (
          SELECT 1 FROM consent_state_revisions
          WHERE team_id = ? AND state_revision = ?
        )
      `).run(decisionId, row.proposal_digest, row.receiving_team_id, expectedRevision,
        row.receiving_team_id, expectedRevision);
      if (Number(consumedResult.changes) !== 1) {
        database.exec('ROLLBACK');
        transactionOpen = false;
        return {statusCode: 409, body: {error: 'stale-authoritative-revision'}};
      }
      database.prepare(`
        INSERT INTO issued_cpu_consents
          (proposal_id, state_revision, proposal_digest, envelope_json)
        VALUES (?, ?, ?, ?)
      `).run(proposalId, expectedRevision, row.proposal_digest, canonicalJson(envelope));
      database.exec('COMMIT');
      transactionOpen = false;
    } catch (error) {
      if (transactionOpen) {
        try {
          database.exec('ROLLBACK');
        } catch (rollbackError) {
          throw new AggregateError([error, rollbackError], 'Consent issuance rollback failed');
        }
      }
      throw error;
    }
    return envelopeResponse({
      proposal_id: proposalId,
      state_revision: expectedRevision,
      proposal_digest: row.proposal_digest,
      envelope_json: canonicalJson(envelope)
    }, row);
  }

  async function issueConsent(proposalId, expectedRevision, {signal} = {}) {
    if (typeof proposalId !== 'string' || typeof expectedRevision !== 'string') {
      return issueConsentOnce(proposalId, expectedRevision, signal);
    }
    const identity = JSON.stringify([proposalId, expectedRevision]);
    const active = inFlight.get(identity);
    if (active) {
      const result = await active;
      if (signal?.aborted) return cancelled();
      if (result.statusCode === 499) {
        return {statusCode: 409, body: {error: 'concurrent-issuance-cancelled-retry'}};
      }
      return result;
    }
    const operation = issueConsentOnce(proposalId, expectedRevision, signal);
    inFlight.set(identity, operation);
    try {
      return await operation;
    } finally {
      if (inFlight.get(identity) === operation) inFlight.delete(identity);
    }
  }

  async function start({port = 0} = {}) {
    if (closed) throw new Error('Authority is closed');
    if (server) throw new Error('Authority server is already listening');
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new TypeError('Invalid local port');
    server = http.createServer(async (request, response) => {
      const send = (statusCode, body) => {
        response.writeHead(statusCode, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff'
        });
        response.end(JSON.stringify(body));
      };
      if (request.url !== ENDPOINT) return send(404, {error: 'not-found'});
      if (request.method !== 'POST') return send(405, {error: 'method-not-allowed'});
      const authorization = request.headers.authorization || '';
      const expectedAuthorization = `Bearer ${apiToken}`;
      if (authorization.length !== expectedAuthorization.length ||
          !crypto.timingSafeEqual(Buffer.from(authorization), Buffer.from(expectedAuthorization))) {
        return send(401, {error: 'local-authority-authentication-required'});
      }
      if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
        return send(415, {error: 'application-json-required'});
      }
      const controller = new AbortController();
      request.on('aborted', () => controller.abort());
      response.on('close', () => {
        if (!response.writableEnded) controller.abort();
      });
      try {
        const body = await readJsonBody(request);
        if (controller.signal.aborted || response.destroyed) return;
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            Object.keys(body).sort().join(',') !== 'expectedRevision,proposalId') {
          return send(400, {error: 'only proposalId and expectedRevision are accepted'});
        }
        const result = await issueConsent(body.proposalId, body.expectedRevision, {
          signal: controller.signal
        });
        if (controller.signal.aborted || response.destroyed) return;
        if (result.statusCode === 499) return;
        return send(result.statusCode, result.body);
      } catch (error) {
        if (response.destroyed) return;
        const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 503;
        return send(statusCode, {error: statusCode === 400 ? error.message : 'authority-service-failure'});
      }
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
    return Object.freeze({
      url: `http://127.0.0.1:${server.address().port}${ENDPOINT}`,
      host: '127.0.0.1',
      keyId,
      apiToken,
      publicKey: keyPair.publicKey.export({type: 'spki', format: 'pem'})
    });
  }

  async function close() {
    if (closed) return;
    closed = true;
    if (server?.listening) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    database.close();
  }

  return Object.freeze({
    enabled: true,
    keyId,
    publicKey: keyPair.publicKey.export({type: 'spki', format: 'pem'}),
    registerAuthoritativeProposal,
    start,
    close,
    issueConsent
  });
}

module.exports = {
  createLocalCpuConsentAuthority,
  canonicalTradeDigest,
  validateProposal
};
