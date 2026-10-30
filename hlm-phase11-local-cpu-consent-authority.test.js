'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {
  createLocalCpuConsentAuthority,
  canonicalTradeDigest
} = require('./hlm-phase11-local-cpu-consent-authority');

const REVISION = 'revision-1';
const PROPOSAL_ID = 'server-proposal-1';
const proposal = () => ({
  outgoingPlayerId: 'p1',
  incomingPlayerId: 'p2',
  picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
});

function fixture() {
  return createGameStateEnvelope({
    meta: {saveId: 'local-authority-test', controlledTeamId: 'A', currentDate: '2027-01-02'},
    teams: [{id: 'A'}, {id: 'B'}],
    players: [{id: 'p1', teamId: 'A'}, {id: 'p2', teamId: 'B'}],
    contracts: [
      {playerId: 'p1', teamId: 'A', status: 'active', aav: 1, tradePermission: 'allowed'},
      {playerId: 'p2', teamId: 'B', status: 'active', aav: 1, tradePermission: 'allowed'}
    ],
    draftPicks: [
      {id: 'pick1', year: 2027, round: 1, originalTeamId: 'A', teamId: 'A'},
      {id: 'pick2', year: 2028, round: 1, originalTeamId: 'B', teamId: 'B'}
    ],
    finances: {teamCapLimits: {A: 100, B: 100}},
    extensions: {tradeRosterLimits: {A: 10, B: 10}}
  });
}

function tempPaths() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hlm-cpu-consent-'));
  return {
    directory,
    databasePath: path.join(directory, 'authority.sqlite'),
    privateKeyPath: path.join(directory, 'signing-key.pem')
  };
}

function createAuthority(paths, policy = {evaluate: async () => 'accepted'}) {
  return createLocalCpuConsentAuthority({...paths, enabled: true, policy});
}

function register(authority, revision = REVISION) {
  return authority.registerAuthoritativeProposal({
    proposalId: PROPOSAL_ID,
    state: fixture(),
    proposal: proposal(),
    stateRevision: revision
  });
}

async function post(server, body) {
  return fetch(server.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${server.apiToken}`
    },
    body: JSON.stringify(body)
  });
}

function verifyEnvelope(envelope, publicKey) {
  const {signature, ...payload} = envelope;
  return crypto.verify(null, Buffer.from(JSON.stringify(sortKeys(payload))), publicKey,
    Buffer.from(signature, 'base64url'));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]));
  }
  return value;
}

test('default-off authority creates neither signing key nor local database', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  const authority = createLocalCpuConsentAuthority(paths);
  assert.equal(authority.enabled, false);
  await assert.rejects(authority.start(), /disabled/);
  assert.throws(() => register(authority), /disabled/);
  assert.equal(fs.existsSync(paths.databasePath), false);
  assert.equal(fs.existsSync(paths.privateKeyPath), false);
});

test('server evaluates the authoritative proposal and signs all decision bindings', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  let observed;
  const authority = createAuthority(paths, {
    async evaluate(context) {
      observed = context;
      return 'accepted';
    }
  });
  t.after(() => authority.close());
  register(authority);
  const server = await authority.start();
  const unauthorized = await fetch(server.url, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  assert.equal(unauthorized.status, 401);
  const response = await post(server, {proposalId: PROPOSAL_ID, expectedRevision: REVISION});
  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(observed.proposalId, PROPOSAL_ID);
  assert.equal(observed.stateRevision, REVISION);
  assert.equal(observed.controlledTeamId, 'A');
  assert.equal(observed.receivingTeamId, 'B');
  assert.equal(Object.isFrozen(observed), true);
  assert.deepEqual(envelope.teamIds, ['A', 'B']);
  assert.equal(envelope.cpuDecision, 'accepted');
  assert.equal(envelope.decision, 'approve');
  assert.ok(envelope.decisionId);
  assert.equal(envelope.proposalDigest, canonicalTradeDigest({
    proposalId: PROPOSAL_ID,
    stateRevision: REVISION,
    controlledTeamId: 'A',
    receivingTeamId: 'B',
    proposal: proposal()
  }));
  assert.ok(Date.parse(envelope.expiresAt) > Date.parse(envelope.issuedAt));
  assert.equal(verifyEnvelope(envelope, server.publicKey), true);
  for (const patch of [
    {decisionId: 'client-controlled-id'},
    {proposalDigest: 'forged-digest'},
    {stateRevision: 'stale-revision'},
    {expiresAt: envelope.issuedAt}
  ]) {
    assert.equal(verifyEnvelope({...envelope, ...patch}, server.publicKey), false);
  }
  assert.equal(server.host, '127.0.0.1');
});

test('client approval claims and wrong-team requests are rejected', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  let policyCalls = 0;
  const authority = createAuthority(paths, {async evaluate() { policyCalls++; return 'accepted'; }});
  t.after(() => authority.close());
  register(authority);
  const server = await authority.start();

  const forged = await post(server, {
    proposalId: PROPOSAL_ID,
    expectedRevision: REVISION,
    decision: 'approve',
    cpuDecision: 'accepted',
    signature: 'forged',
    decisionId: 'client-id',
    teamId: 'B'
  });
  assert.equal(forged.status, 400);
  assert.match((await forged.json()).error, /only proposalId and expectedRevision/);
  assert.equal(policyCalls, 0);

  const valid = await post(server, {proposalId: PROPOSAL_ID, expectedRevision: REVISION});
  const envelope = await valid.json();
  assert.equal(verifyEnvelope({...envelope, teamId: 'C'}, server.publicKey), false);
  assert.equal(verifyEnvelope({...envelope, controlledTeamId: 'C'}, server.publicKey), false);
  assert.equal(verifyEnvelope({...envelope, signature: 'Zm9yZ2Vk'}, server.publicKey), false);
});

test('stale authoritative revisions are rejected before invoking CPU policy', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  let policyCalls = 0;
  const authority = createAuthority(paths, {async evaluate() { policyCalls++; return 'accepted'; }});
  t.after(() => authority.close());
  register(authority, 'revision-2');
  const server = await authority.start();
  const response = await post(server, {proposalId: PROPOSAL_ID, expectedRevision: REVISION});
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'stale-authoritative-revision');
  assert.equal(policyCalls, 0);
});

test('revision change during policy evaluation fails the durable revision guard', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  let authority;
  authority = createAuthority(paths, {
    async evaluate() {
      register(authority, 'revision-2');
      return 'accepted';
    }
  });
  t.after(() => authority.close());
  register(authority);
  const server = await authority.start();
  const response = await post(server, {proposalId: PROPOSAL_ID, expectedRevision: REVISION});
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'stale-authoritative-revision');
});

test('replays and concurrent requests have exactly one accepted issuance', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  let policyCalls = 0;
  const authority = createAuthority(paths, {
    async evaluate() {
      policyCalls++;
      await new Promise(resolve => setTimeout(resolve, 15));
      return 'accepted';
    }
  });
  t.after(() => authority.close());
  register(authority);
  const server = await authority.start();
  const attempts = await Promise.all(Array.from({length: 8}, () =>
    post(server, {proposalId: PROPOSAL_ID, expectedRevision: REVISION})));
  assert.ok(attempts.every(response => response.status === 200));
  const envelopes = await Promise.all(attempts.map(response => response.json()));
  assert.ok(envelopes.every(envelope => JSON.stringify(envelope) === JSON.stringify(envelopes[0])));
  assert.equal(policyCalls, 1);
  const replay = await post(server, {proposalId: PROPOSAL_ID, expectedRevision: REVISION});
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), envelopes[0]);
});

test('restart preserves signing identity, authoritative proposal, and replay history', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  let authority = createAuthority(paths);
  register(authority);
  const first = await authority.start();
  const firstEnvelope = await (await post(first, {
    proposalId: PROPOSAL_ID,
    expectedRevision: REVISION
  })).json();
  const keyId = first.keyId;
  await authority.close();

  authority = createAuthority(paths);
  t.after(() => authority.close());
  const second = await authority.start();
  assert.equal(second.keyId, keyId);
  assert.equal(verifyEnvelope(firstEnvelope, second.publicKey), true);
  const replay = await post(second, {proposalId: PROPOSAL_ID, expectedRevision: REVISION});
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), firstEnvelope);
  assert.equal(fs.statSync(paths.privateKeyPath).mode & 0o777, 0o600);
  assert.equal(fs.statSync(paths.databasePath).mode & 0o777, 0o600);
});

test('policy and malformed service requests fail closed without issuing consent', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  const authority = createAuthority(paths, {async evaluate() { throw new Error('policy unavailable'); }});
  t.after(() => authority.close());
  register(authority);
  const server = await authority.start();

  const policyFailure = await post(server, {proposalId: PROPOSAL_ID, expectedRevision: REVISION});
  assert.equal(policyFailure.status, 503);
  assert.deepEqual(await policyFailure.json(), {error: 'authority-service-failure'});
  const malformed = await post(server, '{invalid');
  assert.equal(malformed.status, 400);
  const missing = await post(server, {proposalId: 'not-registered', expectedRevision: REVISION});
  assert.equal(missing.status, 404);
  const oversized = await post(server, {proposalId: 'x'.repeat(9000), expectedRevision: REVISION});
  assert.equal(oversized.status, 413);
});

test('server-side CPU policy can decline, while invalid authoritative trades cannot register', async t => {
  const paths = tempPaths();
  t.after(() => fs.rmSync(paths.directory, {recursive: true, force: true}));
  const authority = createAuthority(paths, {async evaluate() { return 'declined'; }});
  t.after(() => authority.close());
  const invalid = proposal();
  invalid.picks[0].fromTeamId = 'B';
  assert.throws(() => authority.registerAuthoritativeProposal({
    proposalId: PROPOSAL_ID,
    state: fixture(),
    proposal: invalid,
    stateRevision: REVISION
  }), /draft-pick/);
  register(authority);
  const server = await authority.start();
  const response = await post(server, {proposalId: PROPOSAL_ID, expectedRevision: REVISION});
  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.cpuDecision, 'declined');
  assert.equal(envelope.decision, 'decline');
  assert.equal(verifyEnvelope(envelope, server.publicKey), true);
});
