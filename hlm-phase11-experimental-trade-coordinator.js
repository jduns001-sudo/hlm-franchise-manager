'use strict';
/* A-22 Step 45: default-off composition of signed consent, GM review, and isolated settlement. */
const {createIsolatedTradeSettlementTransaction, createTradeProposalBinding} =
  require('./hlm-phase11-isolated-trade-settlement-transaction');
const {validEnvelope} = require('./hlm-phase11-protected-cpu-consent-contract');
const {canonicalProposalDigestInput} = require('./hlm-phase11-trade-proposal-digest');

const blocked = (code, reason) => Object.freeze({
  status: 'experimental-trade-coordinator-blocked',
  code,
  ...(reason ? {reason} : {}),
  saved: false,
  settlementAuthorized: false,
  experimental: true
});

function cloneJson(value) {
  const text = JSON.stringify(value);
  if (text === undefined) throw new TypeError('JSON-compatible value required');
  return JSON.parse(text);
}

function sourceProbeState(state, proposal) {
  const existing = state.extensions?.tradeDecisionConsents;
  if (existing !== undefined && !Array.isArray(existing)) {
    throw new TypeError('Invalid receiving-team consent source');
  }
  const incoming = state.universe?.players?.find(player =>
    String(player.id) === String(proposal.incomingPlayerId));
  return {
    ...state,
    extensions: {
      ...state.extensions,
      tradeDecisionConsents: [...(existing || []), {
        receivingTeamId: String(incoming?.teamId ?? ''),
        outgoingPlayerId: String(proposal.outgoingPlayerId ?? ''),
        incomingPlayerId: String(proposal.incomingPlayerId ?? ''),
        decision: 'accepted',
        source: 'receiving-team-authority'
      }]
    }
  };
}

function createExperimentalTradeCoordinator({
  enabled = false,
  authority,
  bridge,
  repository,
  key,
  consentVerifier,
  now
} = {}) {
  if (enabled !== false && enabled !== true) throw new TypeError('Invalid coordinator enable flag');
  if (!enabled) {
    return Object.freeze({
      enabled: false,
      async review() { return blocked('disabled-by-default'); },
      async decide() { return blocked('disabled-by-default'); }
    });
  }
  if (!authority || typeof authority.issueConsent !== 'function' ||
      !bridge || typeof bridge.review !== 'function' ||
      !repository || typeof repository.readSnapshot !== 'function' ||
      typeof repository.commitTradeAtomically !== 'function' ||
      typeof repository.getTradeReceipt !== 'function' ||
      typeof key !== 'string' || !key.startsWith('hlm-phase11-isolated-') ||
      !consentVerifier || typeof consentVerifier.verify !== 'function' ||
      typeof now !== 'function') {
    throw new TypeError('Authority, consent bridge, isolated receipt repository, verifier, and clock required');
  }

  let bridgeRecord = null;
  let originalConsentRecords = null;
  const sourceRepository = {
    async readSnapshot(snapshotKey) {
      const snapshot = await repository.readSnapshot(snapshotKey);
      if (!snapshot || !bridgeRecord) return snapshot;
      const records = snapshot.state.extensions?.tradeDecisionConsents;
      if (records !== undefined && !Array.isArray(records)) {
        throw new TypeError('Invalid receiving-team consent source');
      }
      originalConsentRecords = cloneJson(records || []);
      return {
        ...snapshot,
        state: {
          ...snapshot.state,
          extensions: {
            ...snapshot.state.extensions,
            tradeDecisionConsents: [...originalConsentRecords, bridgeRecord]
          }
        }
      };
    },
    async commitTradeAtomically(request) {
      const candidateState = cloneJson(request.candidateState);
      if (bridgeRecord) {
        const records = candidateState.extensions?.tradeDecisionConsents;
        if (!Array.isArray(records)) throw new TypeError('Bridged consent source missing from candidate');
        const matching = records.filter(record =>
          record?.decisionId === bridgeRecord.decisionId &&
          record?.signature === bridgeRecord.signature);
        if (matching.length !== 1) throw new Error('Bridged consent record changed before commit');
        candidateState.extensions.tradeDecisionConsents = records.filter(record =>
          record?.decisionId !== bridgeRecord.decisionId ||
          record?.signature !== bridgeRecord.signature);
        if (!originalConsentRecords?.length &&
            candidateState.extensions.tradeDecisionConsents.length === 0) {
          delete candidateState.extensions.tradeDecisionConsents;
        }
      }
      return repository.commitTradeAtomically({...request, candidateState});
    }
  };
  const settlement = createIsolatedTradeSettlementTransaction({
    repository: sourceRepository,
    key,
    enabled: true,
    consentVerifier,
    now
  });
  let pending = false;

  async function recoverCommitted(proposal, envelope, snapshot) {
    if (!validEnvelope(envelope) || !snapshot) return null;
    const stored = await repository.getTradeReceipt(envelope.decisionId);
    const binding = stored?.receipt?.canonicalBinding;
    const canonicalBinding = binding && JSON.stringify([
      binding.schema,
      binding.key,
      binding.expectedRevision,
      binding.decisionId,
      binding.proposalDigest,
      binding.receivingTeamId,
      binding.controlledTeamId
    ]);
    if (!stored || stored.receipt?.schema !== 'hlm-experimental-trade-settlement-receipt-v1' ||
        stored.canonicalBinding !== canonicalBinding ||
        binding?.key !== key ||
        binding?.decisionId !== envelope.decisionId ||
        binding?.expectedRevision !== envelope.stateRevision ||
        binding?.proposalDigest !== envelope.proposalDigest ||
        binding?.receivingTeamId !== envelope.teamId ||
        stored.receipt?.proposalDigest !== envelope.proposalDigest ||
        stored.receipt?.committedRevision !== snapshot.revision ||
        envelope.digestSchema !== 'hlm-trade-proposal-digest-v1' ||
        envelope.controlledTeamId !== binding?.controlledTeamId ||
        !Array.isArray(envelope.teamIds) ||
        envelope.teamIds.map(String).sort().join('|') !==
          [envelope.controlledTeamId, envelope.teamId].sort().join('|')) return null;

    let expectedDigest;
    try {
      expectedDigest = await globalThis.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(canonicalProposalDigestInput({
          stateRevision: envelope.stateRevision,
          controlledTeamId: envelope.controlledTeamId,
          receivingTeamId: envelope.teamId,
          proposal
        }))
      );
    } catch {
      return null;
    }
    const digest = Array.from(new Uint8Array(expectedDigest), byte =>
      byte.toString(16).padStart(2, '0')).join('');
    if (digest !== envelope.proposalDigest) return null;
    const settledAtMs = Date.parse(stored.receipt.settledAt);
    if (!Number.isFinite(settledAtMs) ||
        settledAtMs < Date.parse(envelope.issuedAt) ||
        settledAtMs >= Date.parse(envelope.expiresAt)) return null;
    if (await consentVerifier.verify(envelope) !== true) return null;

    const transaction = snapshot.state.activity?.transactions?.find(row =>
      String(row?.id ?? '') === envelope.decisionId &&
      String(row?.receivingTeamDecisionId ?? '') === envelope.decisionId &&
      row?.proposalDigest === envelope.proposalDigest &&
      row?.humanGMApproved === true &&
      row?.source === 'isolated-phase11-trade-settlement' &&
      Array.isArray(row.teams) &&
      String(row.teams[0]) === envelope.controlledTeamId &&
      String(row.teams[1]) === envelope.teamId);
    if (!transaction) return null;
    const transferredPlayers = transaction.assets?.filter(asset => asset.type === 'player') || [];
    if (transferredPlayers.length !== 2 ||
        !transferredPlayers.some(asset => String(asset.id) === String(proposal.outgoingPlayerId) &&
          String(asset.fromTeamId) === envelope.controlledTeamId &&
          String(asset.toTeamId) === envelope.teamId) ||
        !transferredPlayers.some(asset => String(asset.id) === String(proposal.incomingPlayerId) &&
          String(asset.fromTeamId) === envelope.teamId &&
          String(asset.toTeamId) === envelope.controlledTeamId)) return null;
    const transferredPicks = transaction.assets?.filter(asset => asset.type === 'draft-pick') || [];
    if (transferredPicks.length !== proposal.picks.length ||
        proposal.picks.some(pick => !transferredPicks.some(asset =>
          String(asset.id) === String(pick.pickId) &&
          String(asset.fromTeamId) === String(pick.fromTeamId) &&
          String(asset.toTeamId) === String(pick.toTeamId)))) return null;
    return Object.freeze({
      status: 'isolated-trade-candidate-committed',
      decisionId: envelope.decisionId,
      proposalDigest: envelope.proposalDigest,
      replayed: true,
      receipt: stored.receipt,
      saved: true,
      settlementAuthorized: false,
      atomicSettlementVerified: false,
      experimental: true
    });
  }

  async function recoverFromSnapshot(proposal, snapshot) {
    const history = snapshot.state.activity?.transactions;
    if (!Array.isArray(history)) return null;
    const controlledTeamId = String(snapshot.state.meta?.controlledTeamId ?? '');
    const candidates = history.filter(transaction => {
      const assets = transaction?.assets;
      return transaction?.type === 'trade' &&
        transaction?.humanGMApproved === true &&
        transaction?.source === 'isolated-phase11-trade-settlement' &&
        Array.isArray(transaction.teams) &&
        String(transaction.teams[0]) === controlledTeamId &&
        Array.isArray(assets) &&
        assets.some(asset => asset?.type === 'player' &&
          String(asset.id) === String(proposal.outgoingPlayerId) &&
          String(asset.fromTeamId) === controlledTeamId) &&
        assets.some(asset => asset?.type === 'player' &&
          String(asset.id) === String(proposal.incomingPlayerId) &&
          String(asset.toTeamId) === controlledTeamId);
    }).reverse();
    for (const transaction of candidates) {
      const stored = await repository.getTradeReceipt(String(transaction.id ?? ''));
      if (!stored?.consentEnvelope) continue;
      const recovered = await recoverCommitted(proposal, stored.consentEnvelope, snapshot);
      if (recovered) return recovered;
    }
    return null;
  }

  async function review(proposalId, proposal, {signal} = {}) {
    if (pending) return blocked('review-already-pending');
    if (signal?.aborted) return blocked('cancelled');
    let snapshot;
    let input;
    try {
      input = cloneJson(proposal);
      snapshot = await repository.readSnapshot(key);
    } catch (error) {
      return blocked('isolated-snapshot-unavailable', error.message);
    }
    if (!snapshot) return blocked('missing-isolated-save');
    if (typeof snapshot.revision !== 'string' || !snapshot.revision) {
      return blocked('invalid-state-revision');
    }

    try {
      const recovered = await recoverFromSnapshot(input, snapshot);
      if (recovered) return recovered;
    } catch (error) {
      return blocked('receipt-recovery-failed', error.message);
    }

    const issued = await authority.issueConsent(proposalId, snapshot.revision, {signal});
    if (signal?.aborted || issued?.statusCode === 499) return blocked('cancelled');
    if (issued?.statusCode !== 200) {
      return blocked(issued?.body?.error || 'cpu-consent-issuance-failed');
    }
    const envelope = issued.body;
    const latest = await repository.readSnapshot(key);
    if (!latest) return blocked('missing-isolated-save');
    if (latest.revision !== snapshot.revision) {
      try {
        const recovered = await recoverFromSnapshot(input, latest);
        if (recovered) return recovered;
      } catch (error) {
        return blocked('receipt-recovery-failed', error.message);
      }
      return blocked('stale-review');
    }

    const recovered = await recoverCommitted(input, envelope, latest);
    if (recovered) return recovered;
    if (signal?.aborted) return blocked('cancelled');

    const bridged = await bridge.review(snapshot.state, input, snapshot.revision, envelope, {signal});
    if (signal?.aborted || bridged?.code === 'cancelled') return blocked('cancelled');
    if (bridged?.status !== 'receiving-consent-record-bridged' ||
        bridged.independentlyAuthenticated !== true ||
        bridged.record?.decision !== 'accepted') {
      return blocked(bridged?.code || 'receiving-consent-bridge-rejected');
    }
    bridgeRecord = bridged.record;
    originalConsentRecords = cloneJson(snapshot.state.extensions?.tradeDecisionConsents || []);
    const reviewed = await settlement.review(input, envelope, {signal});
    if (reviewed?.status !== 'isolated-trade-awaiting-gm-approval') {
      bridgeRecord = null;
      originalConsentRecords = null;
      return blocked(reviewed?.code || 'human-review-unavailable');
    }
    pending = true;
    return Object.freeze({
      status: 'awaiting-human-gm-approval',
      decisionId: envelope.decisionId,
      proposalDigest: reviewed.proposalDigest,
      receivingTeamId: bridgeRecord.receivingTeamId,
      saved: false,
      settlementAuthorized: false,
      experimental: true
    });
  }

  async function decide(action, {signal} = {}) {
    if (!['approve', 'decline', 'cancel'].includes(action)) {
      throw new TypeError('Explicit human GM decision required');
    }
    if (!pending) return blocked('review-required');
    const result = await settlement.decide(action, {signal});
    if (result.code === 'cancelled') {
      pending = false;
      bridgeRecord = null;
      originalConsentRecords = null;
      return result;
    }
    if (result.code === 'commit-outcome-unknown') return result;
    if (result.status !== 'isolated-trade-candidate-committed') {
      pending = false;
      bridgeRecord = null;
      originalConsentRecords = null;
      return result;
    }
    pending = false;
    bridgeRecord = null;
    originalConsentRecords = null;
    return result;
  }

  return Object.freeze({enabled: true, review, decide});
}

module.exports = {createExperimentalTradeCoordinator};
