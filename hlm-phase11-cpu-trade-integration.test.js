'use strict';
/* A-22 Step 37: default-off integration of CPU evaluation, the local consent authority and
   isolated trade review. Uses an in-memory repository double that counts commit attempts; it makes
   NO claim about SQLite or IndexedDB atomicity and never exercises settlement. */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {createLocalCpuConsentAuthority, canonicalTradeDigest} =
  require('./hlm-phase11-local-cpu-consent-authority');
const {createCpuTradeEvaluationPolicy} = require('./hlm-phase11-cpu-trade-evaluation-policy');
const {createIsolatedTradeSettlementTransaction, createTradeProposalBinding} =
  require('./hlm-phase11-isolated-trade-settlement-transaction');
const {DIGEST_SCHEMA} = require('./hlm-phase11-trade-proposal-digest');
const {evaluateCpuConsent} = require('./hlm-phase11-protected-cpu-consent-contract');

const KEY = 'hlm-phase11-isolated-cpu-integration-test';
const REVISION = 'revision-1';
const PROPOSAL_ID = 'integration-proposal-1';
const proposal = () => ({
  outgoingPlayerId: 'p1',
  incomingPlayerId: 'p2',
  picks: [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]
});

function fixture({outgoingOvr = 80, incomingOvr = 70, savedConsent = false} = {}) {
  return createGameStateEnvelope({
    meta: {saveId: 'cpu-integration', controlledTeamId: 'A', currentDate: '2027-01-02'},
    teams: [{id: 'A'}, {id: 'B'}],
    players: [
      {id: 'p1', teamId: 'A', position: 'C', age: 26, ovr: outgoingOvr, potential: outgoingOvr},
      {id: 'p2', teamId: 'B', position: 'C', age: 26, ovr: incomingOvr, potential: incomingOvr}
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
    extensions: {
      tradeRosterLimits: {A: 10, B: 10},
      // The isolated review stage itself requires a saved receiving-team record.
      ...(savedConsent ? {tradeDecisionConsents: [{
        receivingTeamId: 'B', outgoingPlayerId: 'p1', incomingPlayerId: 'p2',
        decision: 'accepted', source: 'receiving-team-authority'
      }]} : {})
    }
  });
}

function setup(t, {state = fixture(), now, ttlMs, policy} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hlm-cpu-integration-'));
  const policyCalls = [];
  const realPolicy = policy ?? createCpuTradeEvaluationPolicy({enabled: true});
  const authorities = [];
  const makeAuthority = (selectedPolicy = realPolicy) => {
    const authority = createLocalCpuConsentAuthority({
      enabled: true,
      databasePath: path.join(directory, 'authority.sqlite'),
      privateKeyPath: path.join(directory, 'signing-key.pem'),
      policy: {async evaluate(context, options) {
        policyCalls.push(context);
        return selectedPolicy.evaluate(context, options);
      }},
      ...(now ? {now} : {}),
      ...(ttlMs ? {ttlMs} : {})
    });
    authorities.push(authority);
    return authority;
  };
  const authority = makeAuthority();
  t.after(async () => {
    for (const instance of authorities) await instance.close();
    fs.rmSync(directory, {recursive: true, force: true});
  });
  authority.registerAuthoritativeProposal({
    proposalId: PROPOSAL_ID, state, proposal: proposal(), stateRevision: REVISION
  });
  return {
    authority,
    policyCalls,
    state,
    directory,
    reopen: makeAuthority
  };
}

function repositoryDouble(state) {
  let commits = 0;
  const initial = JSON.stringify(state);
  return {
    get commits() { return commits; },
    unchanged: () => JSON.stringify(state) === initial,
    readSnapshot() { return {state: structuredClone(state), revision: REVISION}; },
    async commitTradeAtomically() { commits++; return false; }
  };
}

const sortKeys = value => Array.isArray(value) ? value.map(sortKeys)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sortKeys(value[k])])) : value;

function signatureValid(envelope, publicKeyPem) {
  const {signature, ...payload} = envelope;
  return crypto.verify(null, Buffer.from(JSON.stringify(sortKeys(payload))),
    crypto.createPublicKey(publicKeyPem), Buffer.from(signature, 'base64url'));
}

// Explicitly untrusted double: it only lets the review stage run; it is not the authority.
async function reviewEnvelope(repository, overrides = {}) {
  const {state, revision} = repository.readSnapshot();
  const binding = await createTradeProposalBinding(state, proposal(), revision);
  return {
    version: 1, decisionId: 'untrusted-test-decision', proposalDigest: binding.proposalDigest,
    digestSchema: binding.schema, controlledTeamId: 'A', teamId: binding.receivingTeamId, stateRevision: revision, decision: 'approve',
    issuedAt: '2027-01-02T00:00:00.000Z', expiresAt: '2027-01-03T00:00:00.000Z',
    signature: 'untrusted-test-double', keyId: 'untrusted-test-key', ...overrides
  };
}

const untrustedVerifier = {verify: async () => true};
const reviewClock = () => new Date('2027-01-02T12:00:00Z');

test('everything is default-off and never reaches the repository', async () => {
  const policy = createCpuTradeEvaluationPolicy();
  const authority = createLocalCpuConsentAuthority();
  const repository = repositoryDouble(fixture({savedConsent: true}));
  const transaction = createIsolatedTradeSettlementTransaction({repository, key: KEY});
  assert.equal(policy.enabled, false);
  assert.equal(authority.enabled, false);
  assert.throws(() => authority.registerAuthoritativeProposal(), /disabled/);
  const blocked = await transaction.review(proposal(), await reviewEnvelope(repository));
  assert.equal(blocked.code, 'disabled-by-default');
  assert.equal(blocked.saved, false);
  assert.equal(repository.commits, 0);
  assert.throws(() => createIsolatedTradeSettlementTransaction({
    repository, key: 'hlm_front_office_v8'
  }), /nonproduction/);
  assert.throws(() => createLocalCpuConsentAuthority({
    enabled: true, databasePath: 'hlm_front_office_v8', privateKeyPath: '/tmp/k',
    policy: {evaluate() {}}
  }), /absolute/);
});

test('CPU acceptance yields an authority-signed consent bound to the authoritative proposal', async t => {
  const {authority, policyCalls} = setup(t);
  const envelope = await authority.issueConsent(PROPOSAL_ID, REVISION);
  assert.equal(envelope.statusCode, 200);
  const consent = envelope.body;
  assert.equal(policyCalls.length, 1);
  assert.equal(consent.cpuDecision, 'accepted');
  assert.equal(consent.decision, 'approve');
  assert.equal(consent.teamId, 'B');
  assert.equal(consent.controlledTeamId, 'A');
  assert.equal(consent.stateRevision, REVISION);
  assert.equal(consent.proposalDigest, canonicalTradeDigest({
    proposalId: PROPOSAL_ID, stateRevision: REVISION, controlledTeamId: 'A',
    receivingTeamId: 'B', proposal: proposal()
  }));
  assert.equal(signatureValid(consent, authority.publicKey), true);
});

test('CPU decline is signed as a decline and can never be treated as approval', async t => {
  const {authority} = setup(t, {state: fixture({outgoingOvr: 55, incomingOvr: 90})});
  const {statusCode, body} = await authority.issueConsent(PROPOSAL_ID, REVISION);
  assert.equal(statusCode, 200);
  assert.equal(body.cpuDecision, 'declined');
  assert.equal(body.decision, 'decline');
  assert.equal(signatureValid(body, authority.publicKey), true);
  assert.equal(signatureValid({...body, decision: 'approve', cpuDecision: 'accepted'}, authority.publicKey), false);

  const repository = repositoryDouble(fixture({savedConsent: true}));
  const transaction = createIsolatedTradeSettlementTransaction({
    repository, key: KEY, enabled: true, consentVerifier: untrustedVerifier, now: reviewClock
  });
  const result = await transaction.review(proposal(), body);
  assert.equal(result.code, 'receiving-team-declined');
  assert.equal(result.saved, false);
  assert.equal((await transaction.decide('approve')).code, 'review-required');
  assert.equal(repository.commits, 0);
});

test('tampering with any signed field invalidates the authority signature', async t => {
  const {authority} = setup(t);
  const {body} = await authority.issueConsent(PROPOSAL_ID, REVISION);
  for (const patch of [
    {decisionId: 'other'}, {proposalDigest: 'f'.repeat(64)}, {stateRevision: 'revision-0'},
    {teamId: 'C'}, {controlledTeamId: 'C'}, {teamIds: ['A', 'C']}, {proposalId: 'other'},
    {expiresAt: '2099-01-01T00:00:00.000Z'}, {issuedAt: '2000-01-01T00:00:00.000Z'},
    {decision: 'decline'}, {cpuDecision: 'declined'}, {signature: 'Zm9yZ2Vk'}
  ]) {
    assert.equal(signatureValid({...body, ...patch}, authority.publicKey), false, JSON.stringify(patch));
  }
});

test('stale revisions are rejected before the CPU policy runs', async t => {
  const {authority, policyCalls} = setup(t);
  const stale = await authority.issueConsent(PROPOSAL_ID, 'revision-0');
  assert.equal(stale.statusCode, 409);
  assert.equal(stale.body.error, 'stale-authoritative-revision');
  assert.equal(policyCalls.length, 0);

  authority.registerAuthoritativeProposal({
    proposalId: PROPOSAL_ID, state: fixture(), proposal: proposal(), stateRevision: 'revision-2'
  });
  assert.equal((await authority.issueConsent(PROPOSAL_ID, REVISION)).statusCode, 409);
  assert.equal(policyCalls.length, 0);
  assert.equal((await authority.issueConsent(PROPOSAL_ID, 'revision-2')).statusCode, 200);
  assert.equal((await authority.issueConsent('unknown', 'revision-2')).statusCode, 404);
});

test('an authorized retry for the same proposal and revision returns the original envelope', async t => {
  const {authority, policyCalls} = setup(t);
  const first = await authority.issueConsent(PROPOSAL_ID, REVISION);
  assert.equal(first.statusCode, 200);
  const replay = await authority.issueConsent(PROPOSAL_ID, REVISION);
  assert.equal(replay.statusCode, 200);
  assert.deepEqual(replay.body, first.body);
  assert.equal(policyCalls.length, 1);
});

test('authenticated retry recovers the original envelope and credential after authority restart', async t => {
  const {authority, policyCalls, reopen} = setup(t);
  const initialServer = await authority.start();
  const first = await fetch(initialServer.url, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${initialServer.apiToken}`},
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  const originalEnvelope = await first.json();
  assert.equal(first.status, 200);

  await authority.close();
  const restartedAuthority = reopen();
  const restartedServer = await restartedAuthority.start();
  assert.equal(restartedServer.apiToken, initialServer.apiToken);

  const unauthorized = await fetch(restartedServer.url, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: 'Bearer invalid'},
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  assert.equal(unauthorized.status, 401);
  const retry = await fetch(restartedServer.url, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${restartedServer.apiToken}`},
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), originalEnvelope);
  assert.equal(policyCalls.length, 1);
});

test('concurrent duplicate requests return one persisted decision', async t => {
  const {authority, policyCalls} = setup(t, {
    policy: {async evaluate() {
      await new Promise(resolve => setTimeout(resolve, 15));
      return 'accepted';
    }}
  });
  const results = await Promise.all(Array.from({length: 8}, () =>
    authority.issueConsent(PROPOSAL_ID, REVISION)));
  assert.ok(results.every(result => result.statusCode === 200));
  for (const result of results.slice(1)) assert.deepEqual(result.body, results[0].body);
  assert.equal(policyCalls.length, 1);
});

test('concurrent authority instances cannot return divergent decisions', async t => {
  let arrived = 0;
  let releaseBarrier;
  const barrier = new Promise(resolve => { releaseBarrier = resolve; });
  const evaluateAfterBarrier = decision => async () => {
    if (++arrived === 2) releaseBarrier();
    await barrier;
    return decision;
  };
  const {authority, reopen} = setup(t, {
    policy: {evaluate: evaluateAfterBarrier('accepted')}
  });
  const secondAuthority = reopen({evaluate: evaluateAfterBarrier('declined')});
  const results = await Promise.all([
    authority.issueConsent(PROPOSAL_ID, REVISION),
    secondAuthority.issueConsent(PROPOSAL_ID, REVISION)
  ]);
  assert.deepEqual(results[0], results[1]);
  assert.equal(results[0].statusCode, 200);
  assert.ok(['accepted', 'declined'].includes(results[0].body.cpuDecision));
});

test('cancelled issuance is not persisted and a retry can issue a consent', async t => {
  let releasePolicy;
  let policyStarted;
  const started = new Promise(resolve => { policyStarted = resolve; });
  const policyGate = new Promise(resolve => { releasePolicy = resolve; });
  const {authority, policyCalls} = setup(t, {
    policy: {async evaluate(_context, {signal}) {
      policyStarted();
      await policyGate;
      return signal?.aborted ? 'accepted' : 'accepted';
    }}
  });
  const controller = new AbortController();
  const cancelledRequest = authority.issueConsent(PROPOSAL_ID, REVISION, {
    signal: controller.signal
  });
  await started;
  controller.abort();
  releasePolicy();
  assert.equal((await cancelledRequest).statusCode, 499);

  const retry = await authority.issueConsent(PROPOSAL_ID, REVISION);
  assert.equal(retry.statusCode, 200);
  assert.equal(policyCalls.length, 2);
});

test('expired retries, stale revisions, and conflicting proposal bindings are rejected', async t => {
  let clock = Date.parse('2027-01-02T12:00:00.000Z');
  const {authority, policyCalls} = setup(t, {
    now: () => new Date(clock),
    ttlMs: 1000
  });
  const first = await authority.issueConsent(PROPOSAL_ID, REVISION);
  assert.equal(first.statusCode, 200);
  clock += 1000;
  assert.equal((await authority.issueConsent(PROPOSAL_ID, REVISION)).statusCode, 410);
  assert.equal(policyCalls.length, 1);

  const changedProposal = {
    ...proposal(),
    picks: [{pickId: 'pick2', fromTeamId: 'B', toTeamId: 'A'}]
  };
  assert.throws(() => authority.registerAuthoritativeProposal({
    proposalId: PROPOSAL_ID,
    state: fixture(),
    proposal: changedProposal,
    stateRevision: REVISION
  }), /Conflicting authoritative binding/);
  const changedState = fixture();
  changedState.universe.players[0].ovr += 1;
  assert.throws(() => authority.registerAuthoritativeProposal({
    proposalId: PROPOSAL_ID,
    state: changedState,
    proposal: proposal(),
    stateRevision: REVISION
  }), /Conflicting authoritative binding/);
  assert.equal((await authority.issueConsent(PROPOSAL_ID, REVISION)).statusCode, 410);
});

test('a persisted consent becomes stale after the authoritative team revision advances', async t => {
  const {authority} = setup(t);
  const first = await authority.issueConsent(PROPOSAL_ID, REVISION);
  assert.equal(first.statusCode, 200);
  authority.registerAuthoritativeProposal({
    proposalId: PROPOSAL_ID,
    state: fixture(),
    proposal: proposal(),
    stateRevision: 'revision-2'
  });
  assert.equal((await authority.issueConsent(PROPOSAL_ID, REVISION)).statusCode, 409);
  const current = await authority.issueConsent(PROPOSAL_ID, 'revision-2');
  assert.equal(current.statusCode, 200);
});

test('consent verification rejects expired envelopes and one-time ledger replays', async t => {
  let clock = Date.parse('2027-01-02T12:00:00.000Z');
  const {authority} = setup(t, {now: () => new Date(clock), ttlMs: 1000});
  const {body} = await authority.issueConsent(PROPOSAL_ID, REVISION);
  assert.equal(Date.parse(body.expiresAt) - Date.parse(body.issuedAt), 1000);
  const verifier = {verify: envelope => signatureValid(envelope, authority.publicKey)};
  const seen = new Set();
  const ledger = {async consumeOnce(id) { if (seen.has(id)) return false; seen.add(id); return true; }};
  const check = now => evaluateCpuConsent({
    envelope: body, proposalDigest: body.proposalDigest, teamId: 'B', stateRevision: REVISION,
    now: new Date(now).toISOString(), verifier, ledger, signal: {aborted: false}
  });

  assert.equal((await check(clock + 1000)).reason, 'expired-or-invalid-time');
  assert.equal((await check(clock - 1)).reason, 'expired-or-invalid-time');
  assert.equal(seen.size, 0);
  const first = await check(clock + 500);
  assert.equal(first.accepted, true);
  assert.equal(first.settlementAuthorized, false);
  assert.equal((await check(clock + 500)).reason, 'replayed-or-stale');
  assert.equal((await evaluateCpuConsent({
    envelope: body, proposalDigest: body.proposalDigest, teamId: 'B', stateRevision: REVISION,
    now: new Date(clock + 500).toISOString(), verifier, ledger, signal: {aborted: true}
  })).reason, 'cancelled');
});

const T0 = Date.parse('2027-01-02T12:00:00.000Z');

async function authoritySignedConsent(t, options = {}) {
  const {authority} = setup(t, {now: () => new Date(T0), ...options});
  const {body} = await authority.issueConsent(PROPOSAL_ID, REVISION);
  const verifier = {verify: async envelope => signatureValid(envelope, authority.publicKey)};
  return {authority, consent: body, verifier};
}

function reviewSession(repository, verifier, clock = {ms: T0 + 60000}) {
  const transaction = createIsolatedTradeSettlementTransaction({
    repository, key: KEY, enabled: true, consentVerifier: verifier, now: () => new Date(clock.ms)
  });
  return {transaction, clock};
}

test('authority and review share one versioned digest; signed consent is accepted for GM review', async t => {
  const {consent, verifier} = await authoritySignedConsent(t);
  assert.equal(consent.digestSchema, DIGEST_SCHEMA);
  const repository = repositoryDouble(fixture({savedConsent: true}));
  const binding = await createTradeProposalBinding(repository.readSnapshot().state, proposal(), REVISION);
  assert.equal(binding.schema, DIGEST_SCHEMA);
  assert.equal(binding.proposalDigest, consent.proposalDigest);

  const {transaction} = reviewSession(repository, verifier);
  const review = await transaction.review(proposal(), consent);
  assert.equal(review.status, 'isolated-trade-awaiting-gm-approval');
  assert.equal(review.saved, false);
  assert.equal(review.settlementAuthorized, false);
  assert.equal(review.proposalDigest, consent.proposalDigest);
  assert.equal(repository.commits, 0);
});

test('review fails closed without a source-backed receiving-team record', async t => {
  const {consent, verifier} = await authoritySignedConsent(t);
  const repository = repositoryDouble(fixture());
  const {transaction} = reviewSession(repository, verifier);
  assert.equal((await transaction.review(proposal(), consent)).code, 'source-validation-failed');
  assert.equal(repository.commits, 0);
});

test('review rejects missing, incompatible, or tampered consent bindings', async t => {
  const {consent, verifier} = await authoritySignedConsent(t);
  const repository = repositoryDouble(fixture({savedConsent: true}));
  const {transaction} = reviewSession(repository, verifier);
  const {digestSchema, ...legacy} = consent;
  const cases = {
    'incompatible-consent-version': [legacy, {...consent, digestSchema: 'hlm-trade-proposal-digest-v0'}],
    'receiving-team-consent-mismatch': [
      {...consent, proposalDigest: 'f'.repeat(64)}, {...consent, teamId: 'C'},
      {...consent, controlledTeamId: 'C'}, {...consent, stateRevision: 'revision-0'},
      {...consent, controlledTeamId: undefined}, {}, null
    ],
    'receiving-team-consent-unverified': [{...consent, signature: 'Zm9yZ2Vk'}, {...consent, decisionId: 'x'}]
  };
  for (const [code, envelopes] of Object.entries(cases)) {
    for (const envelope of envelopes) {
      assert.equal((await transaction.review(proposal(), envelope)).code, code, JSON.stringify(envelope)?.slice(0, 60));
    }
  }
  assert.equal((await transaction.decide('approve')).code, 'review-required');
  assert.equal(repository.commits, 0);
});

test('review enforces issue-time and expiry with its own trusted clock', async t => {
  const {consent, verifier} = await authoritySignedConsent(t, {ttlMs: 60000});
  const repository = repositoryDouble(fixture({savedConsent: true}));
  const expiresMs = Date.parse(consent.expiresAt);
  const clock = {ms: T0 - 1};
  const {transaction} = reviewSession(repository, verifier, clock);
  assert.equal((await transaction.review(proposal(), consent)).code, 'consent-expired-or-not-yet-valid');
  clock.ms = expiresMs;
  assert.equal((await transaction.review(proposal(), consent)).code, 'consent-expired-or-not-yet-valid');
  clock.ms = Number.NaN;
  assert.equal((await transaction.review(proposal(), consent)).code, 'consent-expired-or-not-yet-valid');
  clock.ms = expiresMs - 1;
  assert.equal((await transaction.review(proposal(), consent)).status, 'isolated-trade-awaiting-gm-approval');
  // Consent that expires while waiting for the human GM is refused at approval, with no commit.
  clock.ms = expiresMs;
  assert.equal((await transaction.decide('approve')).code, 'consent-expired-or-not-yet-valid');
  assert.equal(repository.commits, 0);
  assert.throws(() => createIsolatedTradeSettlementTransaction({
    repository, key: KEY, enabled: true, consentVerifier: verifier
  }), /review clock/);
});

test('cancellation before, during, and after review never saves', async t => {
  const {consent, verifier} = await authoritySignedConsent(t);
  const repository = repositoryDouble(fixture({savedConsent: true}));
  const {transaction} = reviewSession(repository, verifier);
  assert.equal((await transaction.review(proposal(), consent, {signal: {aborted: true}})).code, 'cancelled');
  assert.equal((await transaction.decide('approve')).code, 'review-required');

  const signal = {aborted: false};
  const abortingVerifier = {verify: async envelope => { signal.aborted = true; return verifier.verify(envelope); }};
  const racing = reviewSession(repository, abortingVerifier).transaction;
  assert.equal((await racing.review(proposal(), consent, {signal})).code, 'cancelled');
  assert.equal((await racing.decide('approve')).code, 'review-required');

  await transaction.review(proposal(), consent);
  assert.equal((await transaction.decide('approve', {signal: {aborted: true}})).code, 'cancelled');
  assert.equal((await transaction.decide('approve')).code, 'review-required');
  assert.equal(repository.commits, 0);
  assert.equal(repository.unchanged(), true);
});

test('GM approval alone reaches the commit boundary; replay and stale state stay blocked', async t => {
  const {consent, verifier} = await authoritySignedConsent(t);
  const repository = repositoryDouble(fixture({savedConsent: true}));
  const {transaction} = reviewSession(repository, verifier);
  await transaction.review(proposal(), consent);
  // The double refuses every commit, so nothing is saved and no atomicity is claimed.
  const result = await transaction.decide('approve');
  assert.equal(result.code, 'stale-or-replayed-settlement');
  assert.equal(result.saved, false);
  assert.equal(result.atomicSettlementVerified, false);
  assert.equal(repository.commits, 1);
  assert.equal((await transaction.decide('approve')).code, 'review-required');
  assert.equal(repository.commits, 1);
  assert.equal(repository.unchanged(), true);
});

test('human GM decision is mandatory; decline and cancel never save', async () => {
  const repository = repositoryDouble(fixture({savedConsent: true}));
  const transaction = createIsolatedTradeSettlementTransaction({
    repository, key: KEY, enabled: true, consentVerifier: untrustedVerifier, now: reviewClock
  });
  const review = await transaction.review(proposal(), await reviewEnvelope(repository));
  assert.equal(review.status, 'isolated-trade-awaiting-gm-approval');
  assert.equal(review.saved, false);
  assert.equal(review.settlementAuthorized, false);
  assert.equal(repository.commits, 0);

  await assert.rejects(transaction.decide(undefined), /human GM decision/);
  await assert.rejects(transaction.decide('accepted'), /human GM decision/);
  await assert.rejects(transaction.decide(true), /human GM decision/);
  assert.equal(repository.commits, 0);

  for (const action of ['decline', 'cancel']) {
    await transaction.review(proposal(), await reviewEnvelope(repository));
    const result = await transaction.decide(action);
    assert.equal(result.code, action);
    assert.equal(result.saved, false);
    assert.equal((await transaction.decide('approve')).code, 'review-required');
  }
  assert.equal(repository.commits, 0);
  assert.equal(repository.unchanged(), true);
});

test('a stale review is invalidated before any commit is attempted', async () => {
  const repository = repositoryDouble(fixture({savedConsent: true}));
  const transaction = createIsolatedTradeSettlementTransaction({
    repository, key: KEY, enabled: true, consentVerifier: untrustedVerifier, now: reviewClock
  });
  await transaction.review(proposal(), await reviewEnvelope(repository));
  const original = repository.readSnapshot;
  repository.readSnapshot = () => ({...original(), revision: 'revision-2'});
  const result = await transaction.decide('approve');
  assert.equal(result.code, 'stale-review');
  assert.equal(result.saved, false);
  assert.equal(repository.commits, 0);
});

test('forged client approval cannot reach the authority or the review stage', async t => {
  const {authority, policyCalls} = setup(t, {state: fixture({outgoingOvr: 55, incomingOvr: 90})});
  const server = await authority.start();
  const response = await fetch(server.url, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${server.apiToken}`},
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION, cpuDecision: 'accepted'})
  });
  assert.equal(response.status, 400);
  assert.equal(policyCalls.length, 0);
  const unauthenticated = await fetch(server.url, {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  assert.equal(unauthenticated.status, 401);

  const real = await fetch(server.url, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${server.apiToken}`},
    body: JSON.stringify({proposalId: PROPOSAL_ID, expectedRevision: REVISION})
  });
  assert.equal((await real.json()).cpuDecision, 'declined');
});
