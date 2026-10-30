'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {createLocalCpuConsentAuthority} = require('./hlm-phase11-local-cpu-consent-authority');
const {createCpuTradeEvaluationPolicy} = require('./hlm-phase11-cpu-trade-evaluation-policy');

const mk = (id, teamId, position, ovr, age = 26, potential = ovr) =>
  ({id, teamId, position, ovr, age, potential});

function state({outgoing = mk('p1', 'A', 'C', 80), incoming = mk('p2', 'B', 'C', 70), extra = [],
  picks, currentDate = '2027-01-02'} = {}) {
  return createGameStateEnvelope({
    meta: {saveId: 'policy-test', controlledTeamId: 'A', currentDate},
    teams: [{id: 'A'}, {id: 'B'}],
    players: [outgoing, incoming, ...extra],
    contracts: [
      {playerId: 'p1', teamId: 'A', status: 'active', aav: 1, tradePermission: 'allowed'},
      {playerId: 'p2', teamId: 'B', status: 'active', aav: 1, tradePermission: 'allowed'}
    ],
    draftPicks: picks ?? [
      {id: 'pick1', year: 2027, round: 1, originalTeamId: 'A', teamId: 'A'},
      {id: 'pick2', year: 2028, round: 2, originalTeamId: 'B', teamId: 'B'}
    ],
    finances: {teamCapLimits: {A: 100, B: 100}},
    extensions: {tradeRosterLimits: {A: 10, B: 10}}
  });
}

const proposal = (picks = [{pickId: 'pick1', fromTeamId: 'A', toTeamId: 'B'}]) =>
  ({outgoingPlayerId: 'p1', incomingPlayerId: 'p2', picks});

const context = (s, p = proposal()) =>
  ({proposalId: 'x', proposal: p, state: s, stateRevision: 'r1', controlledTeamId: 'A', receivingTeamId: 'B'});

const depth = positions => positions.map((pos, i) => mk(`d${i}`, 'B', pos, 60));
const enabled = rules => createCpuTradeEvaluationPolicy({enabled: true, rules});

test('policy is default-off and never returns an acceptance when disabled', async () => {
  const policy = createCpuTradeEvaluationPolicy();
  assert.equal(policy.enabled, false);
  await assert.rejects(policy.evaluate(context(state())), /disabled/);
  assert.equal(policy.explain(context(state())).decision, 'declined');
  assert.throws(() => createCpuTradeEvaluationPolicy({enabled: 'yes'}), /enable flag/);
});

test('accepts a trade that favors the CPU and explains asset values', async () => {
  const policy = enabled();
  const result = policy.explain(context(state()));
  assert.equal(result.decision, 'accepted');
  assert.deepEqual(result.reasons, ['value-meets-margin']);
  assert.equal(result.received.length, 2);
  assert.equal(result.given.length, 1);
  assert.ok(result.netScore > 0 && result.receivedValue > result.givenValue);
  assert.equal(await policy.evaluate(context(state())), 'accepted');
  assert.deepEqual(policy.explain(context(state())), result);
  assert.equal(Object.isFrozen(result), true);
});

test('declines when the CPU gives more value than it receives', () => {
  const s = state({outgoing: mk('p1', 'A', 'C', 60), incoming: mk('p2', 'B', 'C', 85)});
  const result = enabled().explain(context(s, proposal([{pickId: 'pick2', fromTeamId: 'B', toTeamId: 'A'}])));
  assert.equal(result.decision, 'declined');
  assert.deepEqual(result.reasons, ['value-below-margin']);
  assert.ok(result.netScore < 0);
});

test('configurable margin and weights change the outcome deterministically', () => {
  const s = state({outgoing: mk('p1', 'A', 'C', 70), incoming: mk('p2', 'B', 'C', 70), picks: [
    {id: 'pick1', year: 2027, round: 3, originalTeamId: 'A', teamId: 'A'}
  ]});
  const p = proposal();
  assert.equal(enabled({acceptanceMargin: 0}).explain(context(s, p)).decision, 'accepted');
  assert.equal(enabled({acceptanceMargin: 50}).explain(context(s, p)).decision, 'declined');
  const strict = enabled({pick: {roundValues: {3: 0}}, acceptanceMargin: 0.01});
  assert.equal(strict.explain(context(s, p)).decision, 'declined');
});

test('team needs raise or lower the CPU score', () => {
  const pick = [{id: 'pick1', year: 2027, round: 7, originalTeamId: 'A', teamId: 'A'}];
  const rules = {pick: {roundValues: {7: 0}}, needs: {valuePerSlot: 20}};
  const extra = depth(['G', 'C', 'C', 'C', 'C']);
  // CPU has one goalie (minimum 2) and receives a goalie for a surplus center.
  const filled = state({outgoing: mk('p1', 'A', 'G', 70), incoming: mk('p2', 'B', 'C', 70), picks: pick, extra});
  const gain = enabled(rules).explain(context(filled));
  assert.equal(gain.needAdjustment, 20);
  assert.equal(gain.decision, 'accepted');
  // Reverse: CPU gives up one of two goalies and receives a center.
  const losing = state({outgoing: mk('p1', 'A', 'C', 70), incoming: mk('p2', 'B', 'G', 70), picks: pick, extra});
  const loss = enabled(rules).explain(context(losing));
  assert.equal(loss.needAdjustment, -20);
  assert.equal(loss.decision, 'declined');
  assert.equal(enabled({...rules, needs: {valuePerSlot: 0}}).explain(context(losing)).decision, 'accepted');
});

test('fails closed on missing or inconsistent source data', () => {
  const policy = enabled();
  const cases = {
    'player-ratings-missing': state({outgoing: {id: 'p1', teamId: 'A', position: 'C'}}),
    'player-position-missing': state({outgoing: {id: 'p1', teamId: 'A', ovr: 80, age: 25, potential: 80}}),
    'player-position-unknown': state({outgoing: mk('p1', 'A', 'X', 80)}),
    'player-ownership-invalid': state({outgoing: mk('p1', 'B', 'C', 80)}),
    'current-date-missing': state({currentDate: null}),
    'pick-missing': state({picks: []}),
    'pick-data-missing': state({picks: [
      {id: 'pick1', year: 2027, round: 99, originalTeamId: 'A', teamId: 'A'}
    ]})
  };
  for (const [code, s] of Object.entries(cases)) {
    const result = policy.explain(context(s));
    assert.equal(result.decision, 'declined', code);
    assert.deepEqual(result.reasons, [`missing-or-invalid:${code}`], code);
  }
  assert.equal(policy.explain(null).decision, 'declined');
  assert.equal(policy.explain(context(state(), {...proposal(), valueScore: 999})).decision, 'declined');
  const wrongOwner = state({picks: [{id: 'pick1', year: 2027, round: 1, originalTeamId: 'A', teamId: 'B'}]});
  assert.equal(policy.explain(context(wrongOwner)).decision, 'declined');
});

test('client-supplied approval or valuation fields cannot influence the decision', () => {
  const s = state({outgoing: mk('p1', 'A', 'C', 55), incoming: mk('p2', 'B', 'C', 90)});
  const base = enabled().explain(context(s));
  assert.equal(base.decision, 'declined');
  const forged = {...context(s), clientApproved: true, valuation: {netScore: 9999}, decision: 'accepted'};
  assert.deepEqual(enabled().explain(forged), base);
  const tamperedPlayer = state({outgoing: {...mk('p1', 'A', 'C', 55), value: 9999, approved: true},
    incoming: mk('p2', 'B', 'C', 90)});
  assert.equal(enabled().explain(context(tamperedPlayer)).decision, 'declined');
  assert.equal(enabled().explain(context(s, {...proposal(), approved: true})).decision, 'declined');
});

test('rejects invalid or unknown rule configuration', () => {
  assert.throws(() => enabled({bogus: 1}), /Unknown rule/);
  assert.throws(() => enabled({player: {nope: 1}}), /Unknown rule/);
  assert.throws(() => enabled({acceptanceMargin: Number.NaN}), /finite/);
  assert.throws(() => enabled({pick: {yearDiscountPerYear: 1}}), /in-range/);
  assert.throws(() => enabled({needs: {positionMinimums: {C: -1}}}), /in-range/);
  assert.throws(() => enabled('rules'), /plain object/);
  assert.equal(Object.isFrozen(enabled().rules), true);
});

test('works through the experimental consent authority without bypassing it', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hlm-cpu-policy-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  const authority = createLocalCpuConsentAuthority({
    enabled: true,
    databasePath: path.join(directory, 'authority.sqlite'),
    privateKeyPath: path.join(directory, 'signing-key.pem'),
    policy: enabled()
  });
  t.after(() => authority.close());
  authority.registerAuthoritativeProposal({
    proposalId: 'p-1', state: state(), proposal: proposal(), stateRevision: 'rev-1'
  });
  const server = await authority.start();
  const response = await fetch(server.url, {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: 'Bearer ' + server.apiToken},
    body: JSON.stringify({proposalId: 'p-1', expectedRevision: 'rev-1'})
  });
  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.cpuDecision, 'accepted');
  assert.equal(envelope.proposalId, 'p-1');
});
