'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {createLocalCpuConsentAuthority} = require('./hlm-phase11-local-cpu-consent-authority');
const {createReceivingConsentRecordBridge} = require('./hlm-phase11-receiving-consent-record-bridge');
const {evaluate: evaluateTradeReview} = require('./hlm-phase11-isolated-trade-decision');
const {DIGEST_SCHEMA} = require('./hlm-phase11-trade-proposal-digest');

const REVISION = 'bridge-revision-1';
const PROPOSAL_ID = 'bridge-proposal-1';
const T0 = Date.parse('2027-01-02T12:00:00.000Z');

function fixture() {
  return createGameStateEnvelope({
    meta: {saveId: 'consent-bridge-test', controlledTeamId: 'A', currentDate: '2027-01-02'},
    teams: [{id: 'A'}, {id: 'B'}],
    players: [
      {id: 'p1', teamId: 'A', position: 'C', age: 26, ovr: 80, potential: 80},
      {id: 'p2', teamId: 'B', position: 'C', age: 26, ovr: 70, potential: 70}
    ],
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

const proposal = () => ({
  outgoingPlayerId: 'p1',
  incomingPlayerId: 'p2',
  picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
});

async function setup(t, {decision = 'accepted', now = () => new Date(T0), ledger} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hlm-consent-bridge-'));
  const authority = createLocalCpuConsentAuthority({
    enabled: true,
    databasePath: path.join(directory, 'authority.sqlite'),
    privateKeyPath: path.join(directory, 'signing-key.pem'),
    policy: {evaluate: async () => decision},
    now,
    ttlMs: 60_000
  });
  const state = fixture();
  authority.registerAuthoritativeProposal({
    proposalId: PROPOSAL_ID,
    state,
    proposal: proposal(),
    stateRevision: REVISION
  });
  t.after(async () => {
    await authority.close();
    fs.rmSync(directory, {recursive: true, force: true});
  });
  const server = await authority.start();
  const response = await fetch(server.url, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${server.apiToken}`},
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  const envelope = await response.json();
  assert.equal(response.status, 200);

  const consumed = new Set();
  const replayLedger = ledger || {
    async consumeOnce(id) {
      if (consumed.has(id)) return false;
      consumed.add(id);
      return true;
    }
  };
  const bridge = createReceivingConsentRecordBridge({
    enabled: true,
    publicKey: server.publicKey,
    keyId: server.keyId,
    ledger: replayLedger,
    now: () => new Date(T0 + 1000)
  });
  return {authority, state, envelope, bridge, replayLedger, consumed, server};
}

test('bridge is default-off and never writes franchise or production state', async () => {
  const state = fixture();
  const before = JSON.stringify(state);
  const disabled = createReceivingConsentRecordBridge();
  assert.equal(disabled.enabled, false);
  assert.equal((await disabled.review(state, proposal(), REVISION, {})).code, 'disabled-by-default');
  assert.equal(JSON.stringify(state), before);
});

test('verified server consent becomes a source-valid review row in memory only', async t => {
  const {state, envelope, bridge} = await setup(t);
  const before = JSON.stringify(state);
  assert.throws(() => evaluateTradeReview(state, proposal()), /consent/);

  const result = await bridge.review(state, proposal(), REVISION, envelope);
  assert.equal(result.status, 'receiving-consent-record-bridged', JSON.stringify(result));
  assert.equal(result.independentlyAuthenticated, true);
  assert.equal(result.record.decision, 'accepted');
  assert.equal(result.record.source, 'receiving-team-authority');
  assert.equal(result.record.receivingTeamId, 'B');
  assert.equal(result.record.controlledTeamId, 'A');
  assert.equal(result.record.stateRevision, REVISION);
  assert.equal(result.record.proposalDigest, envelope.proposalDigest);
  assert.equal(result.record.digestSchema, DIGEST_SCHEMA);
  assert.equal(result.record.signature, envelope.signature);
  assert.equal(result.record.verifiedAt, new Date(T0 + 1000).toISOString());
  assert.equal(result.decision.consentVerified, true);
  assert.equal(result.saved, false);
  assert.equal(result.settlementAuthorized, false);
  assert.equal(state.extensions.tradeDecisionConsents, undefined);
  assert.equal(JSON.stringify(state), before);
});

test('declined CPU decision never produces an accepted source record', async t => {
  const {state, envelope, bridge} = await setup(t, {decision: 'declined'});
  const result = await bridge.review(state, proposal(), REVISION, envelope);
  assert.equal(result.code, 'receiving-team-declined');
  assert.equal(result.record, undefined);
  assert.equal(result.saved, false);
  assert.equal(result.settlementAuthorized, false);
});

test('forged signature and mismatched proposal, team, or revision fail closed', async t => {
  const {state, envelope, bridge} = await setup(t);
  const forged = {...envelope, signature: Buffer.from('forged').toString('base64url')};
  assert.equal((await bridge.review(state, proposal(), REVISION, forged)).code,
    'unauthenticated');
  assert.equal((await bridge.review(state, proposal(), 'stale-revision', envelope)).code,
    'binding-mismatch');
  assert.equal((await bridge.review(state, proposal(), REVISION, {
    ...envelope, teamId: 'C'
  })).code, 'binding-mismatch');
  assert.equal((await bridge.review(state, proposal(), REVISION, {
    ...envelope, proposalDigest: 'f'.repeat(64)
  })).code, 'binding-mismatch');
  assert.equal((await bridge.review(state, proposal(), REVISION, {
    ...envelope, controlledTeamId: 'C'
  })).code, 'binding-mismatch');
  assert.equal((await bridge.review(state, {
    ...proposal(), incomingPlayerId: 'p1'
  }, REVISION, envelope)).code, 'source-validation-failed');
});

test('trusted time rejects expired and not-yet-valid consent', async t => {
  const {state, envelope, server, consumed} = await setup(t);
  const expired = createReceivingConsentRecordBridge({
    enabled: true,
    publicKey: server.publicKey,
    keyId: server.keyId,
    ledger: {async consumeOnce(id) { consumed.add(id); return true; }},
    now: () => new Date(Date.parse(envelope.expiresAt))
  });
  assert.equal((await expired.review(state, proposal(), REVISION, envelope)).code,
    'expired-or-invalid-time');
  const future = createReceivingConsentRecordBridge({
    enabled: true,
    publicKey: server.publicKey,
    keyId: server.keyId,
    ledger: {async consumeOnce(id) { consumed.add(id); return true; }},
    now: () => new Date(Date.parse(envelope.issuedAt) - 1)
  });
  assert.equal((await future.review(state, proposal(), REVISION, envelope)).code,
    'expired-or-invalid-time');
});

test('one-use ledger blocks replay of verified server consent', async t => {
  const {state, envelope, bridge} = await setup(t);
  assert.equal((await bridge.review(state, proposal(), REVISION, envelope)).status,
    'receiving-consent-record-bridged');
  assert.equal((await bridge.review(state, proposal(), REVISION, envelope)).code,
    'replayed-or-stale');
});

test('cancellation before and during verification never produces a record', async t => {
  const {state, envelope, server} = await setup(t);
  const cancelledBefore = await createReceivingConsentRecordBridge({
    enabled: true,
    publicKey: server.publicKey,
    keyId: server.keyId,
    ledger: {async consumeOnce() { assert.fail('cancelled review must not consume consent'); }},
    now: () => new Date(T0 + 1000)
  }).review(state, proposal(), REVISION, envelope, {signal: {aborted: true}});
  assert.equal(cancelledBefore.code, 'cancelled');

  const signal = {aborted: false};
  const bridge = await setup(t, {
    ledger: {
      async consumeOnce() {
        signal.aborted = true;
        return true;
      }
    }
  });
  const result = await bridge.bridge.review(
    bridge.state, proposal(), REVISION, bridge.envelope, {signal}
  );
  assert.equal(result.code, 'cancelled');
  assert.equal(result.record, undefined);
});
