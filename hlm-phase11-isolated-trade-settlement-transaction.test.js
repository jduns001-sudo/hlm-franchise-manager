'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {
  createIsolatedTradeSettlementTransaction,
  createTradeProposalBinding
} = require('./hlm-phase11-isolated-trade-settlement-transaction');
const {DIGEST_SCHEMA} = require('./hlm-phase11-trade-proposal-digest');

const KEY = 'hlm-phase11-isolated-settlement-test';
const PRODUCTION_KEY = 'hlm_front_office_v8';
const proposal = () => ({
  outgoingPlayerId: 'p1',
  incomingPlayerId: 'p2',
  picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
});

function fixture() {
  return createGameStateEnvelope({
    meta: {saveId: 'isolated-test', controlledTeamId: 'A', currentDate: '2027-01-02'},
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
    extensions: {
      tradeRosterLimits: {A: 10, B: 10},
      tradeDecisionConsents: [{
        receivingTeamId: 'B',
        outgoingPlayerId: 'p1',
        incomingPlayerId: 'p2',
        decision: 'accepted',
        source: 'receiving-team-authority'
      }]
    }
  });
}

function memoryAtomicRepository(state = fixture()) {
  let current = structuredClone(state);
  let revision = 'revision-1';
  const consumed = new Set();
  let commits = 0;
  return {
    consumed,
    get commits() { return commits; },
    readSnapshot() { return {state: structuredClone(current), revision}; },
    replace(nextState, nextRevision) {
      current = structuredClone(nextState);
      revision = nextRevision;
    },
    state() { return structuredClone(current); },
    async commitTradeAtomically(request) {
      if (request.expectedRevision !== revision || consumed.has(request.decisionId)) return false;
      consumed.add(request.decisionId);
      current = structuredClone(request.candidateState);
      revision = `${revision}-next`;
      commits++;
      return true;
    }
  };
}

async function consentEnvelope(repository, overrides = {}) {
  const snapshot = repository.readSnapshot();
  const proposalBinding = await createTradeProposalBinding(snapshot.state, proposal(), snapshot.revision);
  return {
    version: 1,
    decisionId: 'consent-1',
    proposalDigest: proposalBinding.proposalDigest,
    digestSchema: DIGEST_SCHEMA,
    controlledTeamId: 'A',
    teamId: 'B',
    stateRevision: 'revision-1',
    issuedAt: '2027-01-02T00:00:00Z',
    expiresAt: '2027-01-03T00:00:00Z',
    signature: 'test-only',
    keyId: 'test-only',
    decision: 'approve',
    ...overrides
  };
}

function createSession(repository, options = {}) {
  return createIsolatedTradeSettlementTransaction({
    repository,
    key: KEY,
    enabled: true,
    consentVerifier: {verify: async () => true},
    now: () => new Date('2027-01-02T12:00:00Z'),
    ...options
  });
}

test('default-off never reads or commits, even for an otherwise valid proposal', async () => {
  const repository = memoryAtomicRepository();
  let reads = 0;
  const wrapped = {...repository, readSnapshot() { reads++; return repository.readSnapshot(); }};
  const session = createIsolatedTradeSettlementTransaction({repository: wrapped, key: KEY});
  assert.equal((await session.review(proposal(), {})).code, 'disabled-by-default');
  assert.equal(reads, 0);
  assert.equal(repository.commits, 0);
});

test('approval atomically commits player, pick, contracts, and one settlement history row', async () => {
  const repository = memoryAtomicRepository();
  const before = repository.state();
  const verifierCalls = [];
  const session = createSession(repository, {
    consentVerifier: {verify: async envelope => { verifierCalls.push(envelope.decisionId); return true; }}
  });
  const reviewed = await session.review(proposal(), await consentEnvelope(repository));
  assert.equal(reviewed.status, 'isolated-trade-awaiting-gm-approval');
  assert.equal(reviewed.saved, false);
  const committed = await session.decide('approve');
  assert.equal(committed.status, 'isolated-trade-candidate-committed');
  assert.equal(committed.saved, true);
  assert.equal(committed.settlementAuthorized, false);
  assert.equal(committed.atomicSettlementVerified, false);

  const after = repository.state();
  assert.deepEqual(after.universe.players.map(player => player.teamId), ['B', 'A']);
  assert.deepEqual(after.assets.contracts.map(contract => contract.teamId), ['B', 'A']);
  assert.equal(after.assets.draftPicks[0].teamId, 'B');
  assert.equal(after.activity.transactions.length, 1);
  assert.equal(after.activity.transactions[0].id, 'consent-1');
  assert.equal(after.activity.transactions[0].humanGMApproved, true);
  assert.equal(after.activity.transactions[0].proposalDigest, reviewed.proposalDigest);
  assert.deepEqual(before.universe.players.map(player => player.teamId), ['A', 'B']);
  assert.equal(repository.commits, 1);
  assert.deepEqual(verifierCalls, ['consent-1', 'consent-1']);
});

test('stale revision at decision time rejects before verifier or commit', async () => {
  const repository = memoryAtomicRepository();
  const session = createSession(repository);
  await session.review(proposal(), await consentEnvelope(repository));
  const changed = repository.state();
  changed.meta.currentDate = '2027-01-03';
  repository.replace(changed, 'revision-2');
  assert.equal((await session.decide('approve')).code, 'stale-review');
  assert.equal(repository.commits, 0);
});

test('atomic repository rejects a race after consent verification and before commit', async () => {
  const repository = memoryAtomicRepository();
  let verifications = 0;
  const session = createSession(repository, {
    consentVerifier: {verify: async () => {
      if (++verifications === 1) return true; // review-time verification
      const changed = repository.state();
      changed.meta.currentDate = '2027-01-03';
      repository.replace(changed, 'revision-2');
      return true;
    }}
  });
  await session.review(proposal(), await consentEnvelope(repository));
  assert.equal((await session.decide('approve')).code, 'stale-or-replayed-settlement');
  assert.equal(repository.state().activity.transactions.length, 0);
  assert.equal(repository.commits, 0);
});

test('approved request can recover its receipt after a commit response is lost', async () => {
  const repository = memoryAtomicRepository();
  const receiptByDecision = new Map();
  let attempts = 0;
  const wrapped = {
    ...repository,
    async commitTradeAtomically(request) {
      attempts++;
      if (receiptByDecision.has(request.decisionId)) {
        return {
          committed: true,
          replayed: true,
          receipt: receiptByDecision.get(request.decisionId)
        };
      }
      const committed = await repository.commitTradeAtomically(request);
      assert.equal(committed, true);
      const receipt = {
        decisionId: request.decisionId,
        key: request.key,
        proposalDigest: request.proposalDigest,
        receivingTeamId: request.receivingTeamId,
        expectedRevision: request.expectedRevision
      };
      receiptByDecision.set(request.decisionId, receipt);
      throw new Error('Simulated lost commit response');
    }
  };
  const session = createSession(wrapped);
  await session.review(proposal(), await consentEnvelope(repository));
  await assert.rejects(session.decide('approve'), /lost commit response/);
  const recovered = await session.decide('approve');
  assert.equal(recovered.status, 'isolated-trade-candidate-committed');
  assert.equal(recovered.replayed, true);
  assert.deepEqual(recovered.receipt, receiptByDecision.get('consent-1'));
  assert.equal(repository.commits, 1);
  assert.equal(repository.state().activity.transactions.length, 1);
  assert.equal(attempts, 2);
});

test('receiving consent must bind approval, recipient, digest, and revision', async () => {
  const repository = memoryAtomicRepository();
  const envelope = await consentEnvelope(repository, {teamId: 'A'});
  const session = createSession(repository);
  assert.equal((await session.review(proposal(), envelope)).code, 'receiving-team-consent-mismatch');
  assert.equal(repository.commits, 0);
});

test('receiving team binding does not depend on pick transfer order', async () => {
  const state = fixture();
  const reversedPickDirection = {
    ...proposal(),
    picks: [{pickId: 'pick2', fromTeamId: 'B', toTeamId: 'A'}]
  };
  const binding = await createTradeProposalBinding(state, reversedPickDirection, 'revision-1');
  assert.equal(binding.receivingTeamId, 'B');
});

test('unverified consent, decline, cancel, replay, and duplicate history cannot commit', async () => {
  const repository = memoryAtomicRepository();
  const rejected = createSession(repository, {
    consentVerifier: {verify: async () => false}
  });
  assert.equal((await rejected.review(proposal(), await consentEnvelope(repository))).code,
    'receiving-team-consent-unverified');
  assert.equal((await rejected.decide('approve')).code, 'review-required');
  let calls = 0;
  const revoked = createSession(repository, {consentVerifier: {verify: async () => ++calls === 1}});
  await revoked.review(proposal(), await consentEnvelope(repository));
  assert.equal((await revoked.decide('approve')).code, 'receiving-team-consent-unverified');
  assert.equal(repository.commits, 0);

  for (const action of ['decline', 'cancel']) {
    const session = createSession(repository);
    await session.review(proposal(), await consentEnvelope(repository));
    assert.equal((await session.decide(action)).code, action);
  }
  assert.equal(repository.commits, 0);

  const replayed = createSession(repository);
  await replayed.review(proposal(), await consentEnvelope(repository));
  repository.consumed.add('consent-1');
  assert.equal((await replayed.decide('approve')).code, 'stale-or-replayed-settlement');
  assert.equal(repository.commits, 0);

  const stateWithDuplicate = fixture();
  stateWithDuplicate.activity.transactions.push({transactionId: 'consent-1'});
  const duplicateRepository = memoryAtomicRepository(stateWithDuplicate);
  const duplicateSession = createSession(duplicateRepository);
  await duplicateSession.review(proposal(), await consentEnvelope(duplicateRepository));
  assert.equal((await duplicateSession.decide('approve')).code, 'duplicate-settlement-history');
  assert.equal(duplicateRepository.commits, 0);
});

test('validation failure and production key never commit', async () => {
  const repository = memoryAtomicRepository();
  const envelope = await consentEnvelope(repository);
  const overCap = repository.state();
  overCap.finances.teamCapLimits.A = 0;
  repository.replace(overCap, 'revision-1');
  const session = createSession(repository);
  assert.equal((await session.review(proposal(), envelope)).code, 'source-validation-failed');
  assert.equal(repository.commits, 0);
  assert.throws(() => createIsolatedTradeSettlementTransaction({
    repository,
    key: PRODUCTION_KEY,
    enabled: true,
    consentVerifier: {verify: async () => true}
  }), /nonproduction key/);
});
