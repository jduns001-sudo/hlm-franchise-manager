'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {DIGEST_SCHEMA, canonicalProposalDigestInput} = require('./hlm-phase11-trade-proposal-digest');

const base = () => ({
  stateRevision: 'r1', controlledTeamId: 'A', receivingTeamId: 'B',
  proposal: {
    outgoingPlayerId: 'p1', incomingPlayerId: 'p2',
    picks: [{pickId: 'k2', fromTeamId: 'B', toTeamId: 'A'}, {pickId: 'k1', fromTeamId: 'A', toTeamId: 'B'}]
  }
});

test('digest input is versioned, canonical, and independent of key and pick order', () => {
  const input = canonicalProposalDigestInput(base());
  assert.equal(JSON.parse(input).schema, DIGEST_SCHEMA);
  const reordered = base();
  reordered.proposal = {
    picks: [...reordered.proposal.picks].reverse().map(p => ({toTeamId: p.toTeamId, pickId: p.pickId, fromTeamId: p.fromTeamId})),
    incomingPlayerId: 'p2', outgoingPlayerId: 'p1', extraClientField: 'ignored'
  };
  assert.equal(canonicalProposalDigestInput(reordered), input);
  assert.equal(canonicalProposalDigestInput({...base(), proposal: {
    ...base().proposal, picks: base().proposal.picks.map(p => ({...p, pickId: Number(p.pickId.slice(1))}))
  }}).includes('"pickId":"1"'), true);
});

test('every bound field changes the digest input', () => {
  const input = canonicalProposalDigestInput(base());
  const variants = [
    {...base(), stateRevision: 'r2'}, {...base(), controlledTeamId: 'C'}, {...base(), receivingTeamId: 'C'},
    {...base(), proposal: {...base().proposal, outgoingPlayerId: 'p9'}},
    {...base(), proposal: {...base().proposal, incomingPlayerId: 'p9'}},
    {...base(), proposal: {...base().proposal, picks: [base().proposal.picks[0]]}},
    {...base(), proposal: {...base().proposal, picks: base().proposal.picks.map(p => ({...p, toTeamId: p.fromTeamId, fromTeamId: p.toTeamId}))}}
  ];
  for (const variant of variants) assert.notEqual(canonicalProposalDigestInput(variant), input);
});

test('missing or ambiguous data throws', () => {
  for (const bad of [
    {...base(), stateRevision: ''}, {...base(), controlledTeamId: undefined}, {...base(), proposal: null},
    {...base(), proposal: {...base().proposal, picks: 'x'}},
    {...base(), proposal: {...base().proposal, outgoingPlayerId: {}}},
    {...base(), proposal: {...base().proposal, picks: [{pickId: 'k', fromTeamId: 'A', toTeamId: 'B'},
      {pickId: 'k', fromTeamId: 'A', toTeamId: 'B'}]}}
  ]) assert.throws(() => canonicalProposalDigestInput(bad), TypeError);
});
