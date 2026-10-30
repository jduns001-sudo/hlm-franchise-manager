'use strict';
/* Mission 1470: isolated transaction contract only; no live authority or storage provider. */
const {inspect: inspectComposite} = require('./hlm-phase11-integrated-player-pick-trade');
const {validEnvelope} = require('./hlm-phase11-protected-cpu-consent-contract');
const {DIGEST_SCHEMA, canonicalProposalDigestInput} = require('./hlm-phase11-trade-proposal-digest');

const PRODUCTION_KEY = 'hlm_front_office_v8';
const blocked = (code, reason) => Object.freeze({
  status: 'isolated-trade-settlement-blocked',
  code,
  ...(reason ? {reason} : {}),
  saved: false,
  settlementAuthorized: false,
  atomicSettlementVerified: false,
  experimental: true
});

function cloneJson(value) {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new TypeError('JSON-compatible value required');
  return JSON.parse(serialized);
}

async function inspectAndBind(state, proposal, revision) {
  const reviewed = inspectComposite(state, proposal);
  const controlledTeamId = String(state.meta.controlledTeamId);
  const incoming = state.universe.players.find(player =>
    String(player.id) === String(reviewed.players.incomingPlayerId));
  const otherTeamId = String(incoming.teamId);
  const binding = {
    schema: DIGEST_SCHEMA,
    stateRevision: revision,
    controlledTeamId,
    receivingTeamId: otherTeamId,
    outgoingPlayerId: String(reviewed.players.outgoingPlayerId),
    incomingPlayerId: String(reviewed.players.incomingPlayerId),
    picks: reviewed.picks.map(pick => ({
      pickId: String(pick.pickId),
      year: pick.year,
      round: pick.round,
      originalTeamId: String(pick.originalTeamId),
      fromTeamId: String(pick.currentOwner),
      toTeamId: String(pick.proposedOwner)
    }))
  };
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalProposalDigestInput({
      stateRevision: revision,
      controlledTeamId,
      receivingTeamId: otherTeamId,
      proposal: binding
    }))
  );
  const proposalDigest = Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, '0')).join('');
  return {reviewed, binding, proposalDigest};
}

async function createTradeProposalBinding(state, proposal, revision) {
  const {binding, proposalDigest} = await inspectAndBind(state, proposal, revision);
  return Object.freeze({...binding, proposalDigest});
}

function consentProblem(envelope, binding, proposalDigest, nowMs) {
  if (!validEnvelope(envelope)) return 'receiving-team-consent-mismatch';
  if (envelope.digestSchema !== DIGEST_SCHEMA) return 'incompatible-consent-version';
  if (envelope.decision === 'decline') return 'receiving-team-declined';
  if (envelope.decision !== 'approve' ||
      envelope.teamId !== binding.receivingTeamId ||
      envelope.controlledTeamId !== binding.controlledTeamId ||
      envelope.stateRevision !== binding.stateRevision ||
      envelope.proposalDigest !== proposalDigest) return 'receiving-team-consent-mismatch';
  if (!Number.isFinite(nowMs) || nowMs < Date.parse(envelope.issuedAt) ||
      nowMs >= Date.parse(envelope.expiresAt)) return 'consent-expired-or-not-yet-valid';
  return null;
}

function createCandidateState(state, reviewed, decisionId, proposalDigest) {
  const candidate = cloneJson(state);
  const controlledTeamId = String(state.meta.controlledTeamId);
  const incomingSource = state.universe.players.find(player =>
    String(player.id) === String(reviewed.players.incomingPlayerId));
  const otherTeamId = String(incomingSource.teamId);
  const outgoingPlayerId = String(reviewed.players.outgoingPlayerId);
  const incomingPlayerId = String(reviewed.players.incomingPlayerId);
  const outgoing = candidate.universe.players.find(player => String(player.id) === outgoingPlayerId);
  const incoming = candidate.universe.players.find(player => String(player.id) === incomingPlayerId);

  outgoing.teamId = otherTeamId;
  incoming.teamId = controlledTeamId;

  for (const contract of candidate.assets.contracts) {
    if (contract.status !== 'active') continue;
    if (String(contract.playerId) === outgoingPlayerId) contract.teamId = otherTeamId;
    if (String(contract.playerId) === incomingPlayerId) contract.teamId = controlledTeamId;
  }

  const assets = [
    {type: 'player', id: outgoingPlayerId, fromTeamId: controlledTeamId, toTeamId: otherTeamId},
    {type: 'player', id: incomingPlayerId, fromTeamId: otherTeamId, toTeamId: controlledTeamId}
  ];
  for (const transfer of reviewed.picks) {
    const pick = candidate.assets.draftPicks.find(item => String(item.id) === String(transfer.pickId));
    pick.teamId = String(transfer.proposedOwner);
    assets.push({
      type: 'draft-pick',
      id: String(transfer.pickId),
      fromTeamId: String(transfer.currentOwner),
      toTeamId: String(transfer.proposedOwner)
    });
  }

  const existingTransactions = candidate.activity.transactions;
  if (existingTransactions.some(transaction =>
    String(transaction?.id ?? '') === decisionId ||
    String(transaction?.transactionId ?? '') === decisionId)) {
    return null;
  }
  existingTransactions.push({
    id: decisionId,
    transactionId: decisionId,
    type: 'trade',
    date: candidate.meta.currentDate,
    teams: [controlledTeamId, otherTeamId],
    assets,
    humanGMApproved: true,
    receivingTeamDecisionId: decisionId,
    proposalDigest,
    source: 'isolated-phase11-trade-settlement'
  });
  return candidate;
}

function createIsolatedTradeSettlementTransaction({
  repository,
  key,
  enabled = false,
  consentVerifier,
  now
} = {}) {
  if (!repository || typeof repository.readSnapshot !== 'function' ||
      typeof repository.commitTradeAtomically !== 'function' ||
      typeof key !== 'string' || !key.startsWith('hlm-phase11-isolated-') ||
      key === PRODUCTION_KEY) {
    throw new TypeError('Explicit isolated atomic repository and nonproduction key required');
  }
  if (enabled !== false && enabled !== true) throw new TypeError('Invalid experimental enable flag');
  if (enabled && (!consentVerifier || typeof consentVerifier.verify !== 'function')) {
    throw new TypeError('Protected receiving-team consent verifier required');
  }
  if (enabled && typeof now !== 'function') {
    throw new TypeError('Trusted review clock function required');
  }
  const clockMs = () => {
    const value = now();
    return value instanceof Date ? value.getTime() : Date.parse(value);
  };

  let pending = null;
  async function review(proposal, envelope, {signal} = {}) {
    pending = null;
    if (!enabled) return blocked('disabled-by-default');
    if (signal?.aborted) return blocked('cancelled');

    const snapshot = await repository.readSnapshot(key);
    if (!snapshot) return blocked('missing-isolated-save');
    if (typeof snapshot.revision !== 'string' || !snapshot.revision) {
      return blocked('invalid-state-revision');
    }

    let input;
    let consent;
    let binding;
    let proposalDigest;
    try {
      input = cloneJson(proposal);
      consent = cloneJson(envelope);
      ({binding, proposalDigest} = await inspectAndBind(snapshot.state, input, snapshot.revision));
    } catch (error) {
      return blocked('source-validation-failed', error.message);
    }
    const problem = consentProblem(consent, binding, proposalDigest, clockMs());
    if (problem) return blocked(problem);
    if (signal?.aborted) return blocked('cancelled');
    if (await consentVerifier.verify(consent) !== true) {
      return blocked('receiving-team-consent-unverified');
    }
    if (signal?.aborted) return blocked('cancelled');

    pending = {
      proposal: input,
      envelope: consent,
      revision: snapshot.revision,
      proposalDigest
    };
    return Object.freeze({
      status: 'isolated-trade-awaiting-gm-approval',
      proposalDigest,
      saved: false,
      settlementAuthorized: false,
      atomicSettlementVerified: false,
      experimental: true
    });
  }

  async function decide(action, {signal} = {}) {
    if (!['approve', 'decline', 'cancel'].includes(action)) {
      throw new TypeError('Explicit human GM decision required');
    }
    if (!pending) return blocked('review-required');

    const reviewed = pending;
    pending = null;
    if (action !== 'approve') return blocked(action);
    if (signal?.aborted) return blocked('cancelled');

    const snapshot = await repository.readSnapshot(key);
    if (!snapshot || snapshot.revision !== reviewed.revision) return blocked('stale-review');

    let binding;
    let proposalDigest;
    let composite;
    try {
      ({reviewed: composite, binding, proposalDigest} =
        await inspectAndBind(snapshot.state, reviewed.proposal, snapshot.revision));
    } catch (error) {
      return blocked('review-invalidated', error.message);
    }
    if (proposalDigest !== reviewed.proposalDigest) return blocked('review-invalidated');
    const problem = consentProblem(reviewed.envelope, binding, proposalDigest, clockMs());
    if (problem) return blocked(problem === 'consent-expired-or-not-yet-valid' ? problem : 'review-invalidated');

    if (await consentVerifier.verify(reviewed.envelope) !== true) {
      return blocked('receiving-team-consent-unverified');
    }
    if (signal?.aborted) return blocked('cancelled');

    const candidateState = createCandidateState(
      snapshot.state,
      composite,
      reviewed.envelope.decisionId,
      proposalDigest
    );
    if (!candidateState) return blocked('duplicate-settlement-history');

    // This repository operation must compare revision, consume the decision ID,
    // and persist the complete candidate in one durable transaction.
    // Both injected adapters must be protected implementations in any future service.
    // The test doubles in this repository do not establish production trust or durability.
    const committed = await repository.commitTradeAtomically({
      key,
      expectedRevision: reviewed.revision,
      decisionId: reviewed.envelope.decisionId,
      proposalDigest,
      receivingTeamId: binding.receivingTeamId,
      candidateState
    });
    if (committed !== true) return blocked('stale-or-replayed-settlement');

    return Object.freeze({
      status: 'isolated-trade-candidate-committed',
      decisionId: reviewed.envelope.decisionId,
      proposalDigest,
      saved: true,
      settlementAuthorized: false,
      atomicSettlementVerified: false,
      experimental: true
    });
  }

  return Object.freeze({review, decide});
}

module.exports = {
  createIsolatedTradeSettlementTransaction,
  createTradeProposalBinding
};
