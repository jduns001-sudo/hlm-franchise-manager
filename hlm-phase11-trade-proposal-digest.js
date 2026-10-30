'use strict';
/* A-22 Step 38: single versioned canonical proposal digest shared by the experimental
   CPU consent authority (Node) and the isolated trade review (Node or browser).
   Pure and dependency-free; each side hashes the same canonical string with SHA-256. */

const DIGEST_SCHEMA = 'hlm-trade-proposal-digest-v1';

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

function id(value, name) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError(`Trade digest requires ${name}`);
  }
  const text = String(value);
  if (!text) throw new TypeError(`Trade digest requires ${name}`);
  return text;
}

// Only identity and direction are digested; asset facts are validated separately from source state.
function canonicalProposalDigestInput({stateRevision, controlledTeamId, receivingTeamId, proposal}) {
  if (!proposal || typeof proposal !== 'object' || !Array.isArray(proposal.picks)) {
    throw new TypeError('Trade digest requires a proposal with picks');
  }
  const picks = proposal.picks.map(pick => ({
    pickId: id(pick?.pickId, 'pickId'),
    fromTeamId: id(pick?.fromTeamId, 'fromTeamId'),
    toTeamId: id(pick?.toTeamId, 'toTeamId')
  })).sort((a, b) => (a.pickId < b.pickId ? -1 : a.pickId > b.pickId ? 1 : 0));
  if (new Set(picks.map(pick => pick.pickId)).size !== picks.length) {
    throw new TypeError('Duplicate draft-pick transfer');
  }
  return canonicalJson({
    schema: DIGEST_SCHEMA,
    stateRevision: id(stateRevision, 'stateRevision'),
    controlledTeamId: id(controlledTeamId, 'controlledTeamId'),
    receivingTeamId: id(receivingTeamId, 'receivingTeamId'),
    outgoingPlayerId: id(proposal.outgoingPlayerId, 'outgoingPlayerId'),
    incomingPlayerId: id(proposal.incomingPlayerId, 'incomingPlayerId'),
    picks
  });
}

module.exports = {DIGEST_SCHEMA, canonicalJson, canonicalProposalDigestInput};
