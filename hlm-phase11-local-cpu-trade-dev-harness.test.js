'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {createCpuTradeEvaluationPolicy} = require('./hlm-phase11-cpu-trade-evaluation-policy');
const {createLocalCpuConsentAuthority} = require('./hlm-phase11-local-cpu-consent-authority');
const {createLocalCpuTradeDevelopmentHarness} =
  require('./hlm-phase11-local-cpu-trade-dev-harness');
const {createReceivingConsentRecordBridge} =
  require('./hlm-phase11-receiving-consent-record-bridge');
const {canonicalJson} = require('./hlm-phase11-trade-proposal-digest');

const NOW = Date.parse('2027-01-02T12:00:00.000Z');
const REVISION = 'gateway-dev-revision-1';
const KEY = 'hlm-phase11-isolated-gateway-dev-test';
const TRADE = {
  outgoingPlayerId: 'p1',
  incomingPlayerId: 'p2',
  picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
};

function fixture() {
  return createGameStateEnvelope({
    meta: {saveId: 'gateway-dev-only', controlledTeamId: 'A', currentDate: '2027-01-02'},
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

function createRepository(initialState = fixture(), initialRevision = REVISION) {
  let state = structuredClone(initialState);
  let revision = initialRevision;
  const receipts = new Map();
  let commits = 0;
  return {
    get commits() { return commits; },
    readSnapshot() { return {state: structuredClone(state), revision}; },
    async getTradeReceipt(decisionId) { return receipts.get(decisionId) || null; },
    async commitTradeAtomically(request) {
      if (request.key !== KEY || request.expectedRevision !== revision) {
        return {committed: false, code: 'stale-revision'};
      }
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
      const prior = receipts.get(request.decisionId);
      if (prior) {
        return prior.canonicalBindingJson === bindingJson
          ? {committed: true, replayed: true, receipt: prior.receipt}
          : {committed: false, code: 'decision-binding-conflict'};
      }
      const committedRevision = `${revision}:trade:${request.decisionId}`;
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
      receipts.set(request.decisionId, {
        canonicalBindingJson: bindingJson,
        canonicalBinding: bindingJson,
        consentEnvelope: structuredClone(request.consentEnvelope),
        receipt
      });
      state = structuredClone(request.candidateState);
      revision = committedRevision;
      commits += 1;
      return {committed: true, replayed: false, receipt};
    }
  };
}

async function setup(t, {
  decision = 'accepted',
  corruptSignature = false,
  ttlMs = 60_000,
  advanceAfterIssueMs = 0
} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hlm-cpu-gateway-harness-'));
  let now = NOW;
  const state = fixture();
  const proposal = structuredClone(TRADE);
  const proposals = new Map();
  const authority = createLocalCpuConsentAuthority({
    enabled: true,
    databasePath: path.join(directory, 'authority.sqlite'),
    privateKeyPath: path.join(directory, 'signing-key.pem'),
    policy: {async evaluate() { return decision; }},
    now: () => new Date(now),
    ttlMs
  });
  authority.registerAuthoritativeProposal({
    proposalId: 'gateway-dev-proposal',
    state,
    proposal,
    stateRevision: REVISION
  });
  proposals.set('gateway-dev-proposal', {state, proposal, stateRevision: REVISION});
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
    now: () => new Date(now)
  });
  const authorityAdapter = {
    async issueConsent(...args) {
      const result = await authority.issueConsent(...args);
      if (result.statusCode === 200 && advanceAfterIssueMs) {
        now += advanceAfterIssueMs;
      }
      if (corruptSignature && result.statusCode === 200) {
        return {...result, body: {...result.body, signature: 'A'.repeat(86)}};
      }
      return result;
    }
  };
  const harness = createLocalCpuTradeDevelopmentHarness({
    enabled: true,
    authority: authorityAdapter,
    bridge,
    resolveAuthoritativeProposal(proposalId, stateRevision) {
      const record = proposals.get(proposalId);
      return record?.stateRevision === stateRevision ? record : null;
    },
    now: () => now,
    sessionTtlMs: 60_000
  });
  await harness.start();
  t.after(async () => {
    await harness.close();
    await authority.close();
    fs.rmSync(directory, {recursive: true, force: true});
  });
  const consentVerifier = {async verify(envelope) {
    const {signature, ...payload} = envelope;
    try {
      return crypto.verify(null, Buffer.from(canonicalJson(payload)),
        crypto.createPublicKey(authority.publicKey), Buffer.from(signature, 'base64url'));
    } catch {
      return false;
    }
  }};
  return {
    authority,
    harness,
    proposals,
    repository: createRepository(state),
    consentVerifier,
    setNow(value) { now = value; }
  };
}

test('local development harness is off by default and creates no server', async () => {
  const harness = createLocalCpuTradeDevelopmentHarness();
  assert.equal(harness.enabled, false);
  await assert.rejects(harness.start(), /disabled/);
  await assert.rejects(harness.createCoordinator(), /disabled/);
});

test('gateway-authenticated Node coordinator requires signed consent and explicit GM approval', async t => {
  const {harness, repository, consentVerifier} = await setup(t);
  const coordinator = await harness.createCoordinator({
    repository,
    key: KEY,
    consentVerifier,
    now: () => new Date(NOW)
  });

  const reviewed = await coordinator.review('gateway-dev-proposal', TRADE);
  assert.equal(reviewed.status, 'awaiting-human-gm-approval');
  assert.equal(repository.commits, 0);

  const approved = await coordinator.decide('approve');
  assert.equal(approved.status, 'isolated-trade-candidate-committed');
  assert.equal(approved.receipt.schema, 'hlm-experimental-trade-settlement-receipt-v1');
  assert.equal(approved.receipt.canonicalBinding.controlledTeamId, 'A');
  assert.equal(repository.commits, 1);
  assert.equal(repository.readSnapshot().state.activity.transactions[0].humanGMApproved, true);

  const reloadedCoordinator = await harness.createCoordinator({
    repository,
    key: KEY,
    consentVerifier,
    now: () => new Date(NOW + 1000)
  });
  const recovered = await reloadedCoordinator.review('gateway-dev-proposal', TRADE);
  assert.equal(recovered.replayed, true);
  assert.deepEqual(recovered.receipt, approved.receipt);
  assert.equal(repository.commits, 1);
});

for (const action of ['decline', 'cancel']) {
  test(`gateway-authenticated ${action} never settles`, async t => {
    const {harness, repository, consentVerifier} = await setup(t);
    const coordinator = await harness.createCoordinator({
      repository,
      key: KEY,
      consentVerifier,
      now: () => new Date(NOW)
    });
    const reviewed = await coordinator.review('gateway-dev-proposal', TRADE);
    assert.equal(reviewed.status, 'awaiting-human-gm-approval');
    const result = await coordinator.decide(action);
    assert.equal(result.code, action);
    assert.equal(repository.commits, 0);
  });
}

test('forged consent is rejected by signed receiving-consent verification', async t => {
  const {harness, repository, consentVerifier} = await setup(t, {corruptSignature: true});
  const coordinator = await harness.createCoordinator({
    repository,
    key: KEY,
    consentVerifier,
    now: () => new Date(NOW)
  });
  const result = await coordinator.review('gateway-dev-proposal', TRADE);
  assert.equal(result.status, 'experimental-trade-coordinator-blocked');
  assert.equal(result.code, 'unauthenticated');
  assert.equal(repository.commits, 0);
});

test('expired server consent cannot reach coordinator approval', async t => {
  const {harness, repository, consentVerifier} = await setup(t, {
    ttlMs: 1000,
    advanceAfterIssueMs: 1000
  });
  const coordinator = await harness.createCoordinator({
    repository,
    key: KEY,
    consentVerifier,
    now: () => new Date(NOW + 1000)
  });
  const result = await coordinator.review('gateway-dev-proposal', TRADE);
  assert.equal(result.code, 'consent-expired');
  assert.equal(repository.commits, 0);
});

test('CPU decline reaches no GM approval or settlement', async t => {
  const {harness, repository, consentVerifier} = await setup(t, {decision: 'declined'});
  const coordinator = await harness.createCoordinator({
    repository,
    key: KEY,
    consentVerifier,
    now: () => new Date(NOW)
  });
  const result = await coordinator.review('gateway-dev-proposal', TRADE);
  assert.equal(result.code, 'receiving-team-declined');
  assert.equal(repository.commits, 0);
});

test('stale tab cannot settle after another coordinator changes isolated revision', async t => {
  const {harness, repository, consentVerifier, authority, proposals} = await setup(t);
  const secondId = 'gateway-dev-proposal-second';
  const secondProposal = {
    ...TRADE,
    picks: [
      ...TRADE.picks,
      {pickId: 'pick2', fromTeamId: 'B', toTeamId: 'A'}
    ]
  };
  const secondState = fixture();
  authority.registerAuthoritativeProposal({
    proposalId: secondId,
    state: secondState,
    proposal: secondProposal,
    stateRevision: REVISION
  });
  proposals.set(secondId, {
    state: secondState,
    proposal: secondProposal,
    stateRevision: REVISION
  });
  const firstTab = await harness.createCoordinator({
    repository, key: KEY, consentVerifier, now: () => new Date(NOW)
  });
  const staleTab = await harness.createCoordinator({
    repository, key: KEY, consentVerifier, now: () => new Date(NOW)
  });
  assert.equal((await firstTab.review('gateway-dev-proposal', TRADE)).status,
    'awaiting-human-gm-approval');
  assert.equal((await staleTab.review(secondId, secondProposal)).status,
    'awaiting-human-gm-approval');
  assert.equal((await firstTab.decide('approve')).status,
    'isolated-trade-candidate-committed');
  assert.equal((await staleTab.decide('approve')).code, 'stale-review');
  assert.equal(repository.commits, 1);
  assert.equal(repository.readSnapshot().state.activity.transactions.length, 1);
});
