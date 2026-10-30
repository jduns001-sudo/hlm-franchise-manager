'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {createLocalCpuConsentAuthority} = require('./hlm-phase11-local-cpu-consent-authority');
const {createCpuTradeEvaluationPolicy} = require('./hlm-phase11-cpu-trade-evaluation-policy');
const {createReceivingConsentRecordBridge} = require('./hlm-phase11-receiving-consent-record-bridge');
const {createExperimentalTradeCoordinator} = require('./hlm-phase11-experimental-trade-coordinator');
const {canonicalJson} = require('./hlm-phase11-trade-proposal-digest');

const KEY = 'hlm-phase11-isolated-coordinator-test';
const PROPOSAL_ID = 'coordinator-proposal';
const REVISION = 'coordinator-revision-1';
const NOW = Date.parse('2027-01-02T12:00:00.000Z');
const proposal = () => ({
  outgoingPlayerId: 'p1',
  incomingPlayerId: 'p2',
  picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
});

function fixture() {
  return createGameStateEnvelope({
    meta: {saveId: 'coordinator-test', controlledTeamId: 'A', currentDate: '2027-01-02'},
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

function memoryAtomicRepository(initialState = fixture(), initialRevision = REVISION) {
  let state = structuredClone(initialState);
  let revision = initialRevision;
  const receipts = new Map();
  let commits = 0;
  return {
    get commits() { return commits; },
    readSnapshot() { return {state: structuredClone(state), revision}; },
    async getTradeReceipt(decisionId) { return receipts.get(decisionId) || null; },
    async commitTradeAtomically(request) {
      const canonicalBinding = {
        schema: 'hlm-experimental-trade-settlement-binding-v1',
        key: request.key,
        expectedRevision: request.expectedRevision,
        decisionId: request.decisionId,
        proposalDigest: request.proposalDigest,
        receivingTeamId: request.receivingTeamId,
        controlledTeamId: request.controlledTeamId
      };
      const bindingJson = JSON.stringify([
        canonicalBinding.schema,
        canonicalBinding.key,
        canonicalBinding.expectedRevision,
        canonicalBinding.decisionId,
        canonicalBinding.proposalDigest,
        canonicalBinding.receivingTeamId,
        canonicalBinding.controlledTeamId
      ]);
      const committedRevision = `${request.expectedRevision}:trade:${request.decisionId}`;
      const receipt = {
        schema: 'hlm-experimental-trade-settlement-receipt-v1',
        decisionId: request.decisionId,
        key: request.key,
        proposalDigest: request.proposalDigest,
        receivingTeamId: request.receivingTeamId,
        controlledTeamId: request.controlledTeamId,
        expectedRevision: request.expectedRevision,
        committedRevision,
        canonicalBinding,
        settledAt: request.settledAt
      };
      const prior = receipts.get(request.decisionId);
      if (prior) {
        return prior.canonicalBindingJson === bindingJson
          ? {committed: true, replayed: true, receipt: prior.receipt}
          : {committed: false, code: 'decision-binding-conflict'};
      }
      if (request.key !== KEY || request.expectedRevision !== revision) {
        return {committed: false, code: 'stale-revision'};
      }
      receipts.set(request.decisionId, {
        canonicalBindingJson: bindingJson,
        canonicalBinding: bindingJson,
        consentEnvelope: structuredClone(request.consentEnvelope),
        receipt
      });
      state = structuredClone(request.candidateState);
      revision = committedRevision;
      commits++;
      return {committed: true, replayed: false, receipt};
    }
  };
}

async function setup(t, {
  state = fixture(),
  revision = REVISION,
  decision,
  ttlMs = 60_000,
  now = () => new Date(NOW),
  corruptEnvelope = false
} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hlm-trade-coordinator-'));
  const cpuPolicy = createCpuTradeEvaluationPolicy({enabled: true});
  const authority = createLocalCpuConsentAuthority({
    enabled: true,
    databasePath: path.join(directory, 'authority.sqlite'),
    privateKeyPath: path.join(directory, 'signing-key.pem'),
    policy: {evaluate: async context => decision || cpuPolicy.evaluate(context)},
    now,
    ttlMs
  });
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
  const consumed = new Set();
  const bridge = createReceivingConsentRecordBridge({
    enabled: true,
    publicKey: authority.publicKey,
    keyId: authority.keyId,
    ledger: {async consumeOnce(id) {
      if (consumed.has(id)) return false;
      consumed.add(id);
      return true;
    }},
    now
  });
  const repository = memoryAtomicRepository(state, revision);
  const authorityAdapter = {
    async issueConsent(...args) {
      const result = await authority.issueConsent(...args);
      if (corruptEnvelope && result.statusCode === 200) {
        return {...result, body: {...result.body, signature: 'invalid-signature'}};
      }
      return result;
    }
  };
  const consentVerifier = {async verify(envelope) {
    const {signature, ...payload} = envelope;
    try {
      return crypto.verify(null, Buffer.from(canonicalJson(payload)),
        crypto.createPublicKey(authority.publicKey), Buffer.from(signature, 'base64url'));
    } catch {
      return false;
    }
  }};
  const createCoordinator = ({consentVerifier: selectedVerifier = consentVerifier} = {}) =>
    createExperimentalTradeCoordinator({
    enabled: true,
    authority: authorityAdapter,
    bridge,
    repository,
    key: KEY,
    consentVerifier: selectedVerifier,
    now
  });
  return {authority, repository, bridge, consentVerifier, createCoordinator};
}

test('default-off coordinator does not call injected systems', async () => {
  let calls = 0;
  const coordinator = createExperimentalTradeCoordinator({
    authority: {issueConsent: async () => { calls++; }},
    bridge: {review: async () => { calls++; }},
    repository: {readSnapshot: async () => { calls++; }}
  });
  assert.equal(coordinator.enabled, false);
  assert.equal((await coordinator.review(PROPOSAL_ID, proposal())).code, 'disabled-by-default');
  assert.equal((await coordinator.decide('approve')).code, 'disabled-by-default');
  assert.equal(calls, 0);
});

test('signed CPU consent flows through bridge and explicit GM approval into isolated receipt', async t => {
  const {repository, createCoordinator} = await setup(t);
  const coordinator = createCoordinator();
  const reviewed = await coordinator.review(PROPOSAL_ID, proposal());
  assert.equal(reviewed.status, 'awaiting-human-gm-approval', JSON.stringify(reviewed));
  assert.equal(repository.commits, 0);
  assert.equal(repository.readSnapshot().state.universe.players[0].teamId, 'A');

  const committed = await coordinator.decide('approve');
  assert.equal(committed.status, 'isolated-trade-candidate-committed');
  assert.equal(committed.saved, true);
  assert.equal(committed.settlementAuthorized, false);
  assert.equal(committed.atomicSettlementVerified, false);
  assert.equal(committed.receipt.schema, 'hlm-experimental-trade-settlement-receipt-v1');
  assert.equal(committed.receipt.settledAt, new Date(NOW).toISOString());
  assert.equal(repository.commits, 1);
  const snapshot = repository.readSnapshot();
  assert.deepEqual(snapshot.state.universe.players.map(player => player.teamId), ['B', 'A']);
  assert.equal(snapshot.state.extensions?.tradeDecisionConsents, undefined);
  assert.equal(snapshot.state.activity.transactions[0].humanGMApproved, true);
  assert.equal(snapshot.state.activity.transactions.length, 1);

  const recovered = await createCoordinator().review(PROPOSAL_ID, proposal());
  assert.equal(recovered.status, 'isolated-trade-candidate-committed');
  assert.equal(recovered.replayed, true);
  assert.deepEqual(recovered.receipt, committed.receipt);
  assert.equal(repository.commits, 1);
});

test('decline and cancellation require explicit decisions and never save', async t => {
  const declined = await setup(t, {decision: 'declined'});
  const declineCoordinator = declined.createCoordinator();
  const review = await declineCoordinator.review(PROPOSAL_ID, proposal());
  assert.equal(review.code, 'receiving-team-declined');
  assert.equal(declined.repository.commits, 0);

  const cancelled = await setup(t);
  const cancelCoordinator = cancelled.createCoordinator();
  await cancelCoordinator.review(PROPOSAL_ID, proposal());
  assert.equal((await cancelCoordinator.decide('cancel')).code, 'cancel');
  assert.equal(cancelled.repository.commits, 0);
});

test('forged, stale, expired, and pre-cancelled attempts fail closed', async t => {
  const forged = await setup(t, {corruptEnvelope: true});
  assert.notEqual((await forged.createCoordinator().review(PROPOSAL_ID, proposal())).status,
    'awaiting-human-gm-approval');
  assert.equal(forged.repository.commits, 0);

  const stale = await setup(t, {revision: 'stale-revision'});
  assert.equal((await stale.createCoordinator().review(PROPOSAL_ID, proposal())).code,
    'stale-authoritative-revision');
  assert.equal(stale.repository.commits, 0);

  let clock = NOW;
  const expired = await setup(t, {
    ttlMs: 1000,
    now: () => new Date(clock)
  });
  assert.equal((await expired.authority.issueConsent(PROPOSAL_ID, REVISION)).statusCode, 200);
  clock += 1001;
  assert.equal((await expired.createCoordinator().review(PROPOSAL_ID, proposal())).code,
    'consent-expired');
  assert.equal(expired.repository.commits, 0);

  const cancelled = await setup(t);
  const controller = new AbortController();
  controller.abort();
  assert.equal((await cancelled.createCoordinator().review(PROPOSAL_ID, proposal(), {
    signal: controller.signal
  })).code, 'cancelled');
  assert.equal(cancelled.repository.commits, 0);
});

test('completed trade receipt recovers after the original consent expires', async t => {
  let clock = NOW;
  const {repository, createCoordinator} = await setup(t, {
    ttlMs: 1000,
    now: () => new Date(clock)
  });
  const coordinator = createCoordinator();
  assert.equal((await coordinator.review(PROPOSAL_ID, proposal())).status,
    'awaiting-human-gm-approval');
  const committed = await coordinator.decide('approve');
  assert.equal(committed.status, 'isolated-trade-candidate-committed');
  clock += 1001;

  const recovered = await createCoordinator().review(PROPOSAL_ID, proposal());
  assert.equal(recovered.status, 'isolated-trade-candidate-committed');
  assert.equal(recovered.replayed, true);
  assert.deepEqual(recovered.receipt, committed.receipt);
  assert.equal(repository.commits, 1);
});

test('consent expiring during final verification blocks commit', async t => {
  let clock = NOW;
  const {repository, consentVerifier, createCoordinator} = await setup(t, {
    ttlMs: 1000,
    now: () => new Date(clock)
  });
  let verificationCount = 0;
  const slowVerifier = {
    async verify(envelope) {
      const verified = await consentVerifier.verify(envelope);
      if (++verificationCount === 2) clock += 1001;
      return verified;
    }
  };
  const coordinator = createCoordinator({consentVerifier: slowVerifier});
  assert.equal((await coordinator.review(PROPOSAL_ID, proposal())).status,
    'awaiting-human-gm-approval');
  assert.equal((await coordinator.decide('approve')).code, 'consent-expired-or-not-yet-valid');
  assert.equal(repository.commits, 0);
});

test('cancellation during final verification clears the pending GM approval', async t => {
  const {repository, consentVerifier, createCoordinator} = await setup(t);
  const controller = new AbortController();
  let verificationCount = 0;
  const cancellingVerifier = {
    async verify(envelope) {
      const verified = await consentVerifier.verify(envelope);
      if (++verificationCount === 2) controller.abort();
      return verified;
    }
  };
  const coordinator = createCoordinator({consentVerifier: cancellingVerifier});
  assert.equal((await coordinator.review(PROPOSAL_ID, proposal())).status,
    'awaiting-human-gm-approval');

  assert.equal((await coordinator.decide('approve', {signal: controller.signal})).code,
    'cancelled');
  assert.equal((await coordinator.decide('approve')).code, 'review-required');
  assert.equal(repository.commits, 0);
});
