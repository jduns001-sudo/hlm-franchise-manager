'use strict';
/* A-22 Step 41: default-off, in-memory bridge from signed CPU consent to trade review. */
const crypto = require('node:crypto');
const {evaluate: evaluateTradeReview} = require('./hlm-phase11-isolated-trade-decision');
const {evaluateCpuConsent} = require('./hlm-phase11-protected-cpu-consent-contract');
const {createTradeProposalBinding} = require('./hlm-phase11-isolated-trade-settlement-transaction');
const {DIGEST_SCHEMA, canonicalJson} = require('./hlm-phase11-trade-proposal-digest');

const CONSENT_SCHEMA = 'hlm-local-cpu-consent-v1';
const blocked = (code, reason) => Object.freeze({
  status: 'receiving-consent-record-blocked',
  code,
  ...(reason ? {reason} : {}),
  saved: false,
  settlementAuthorized: false,
  independentlyAuthenticated: false,
  experimental: true
});

function cloneJson(value) {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new TypeError('JSON-compatible value required');
  return JSON.parse(serialized);
}

function createReceivingConsentRecordBridge({
  enabled = false,
  publicKey,
  keyId,
  ledger,
  now
} = {}) {
  if (enabled !== false && enabled !== true) throw new TypeError('Invalid experimental enable flag');
  if (!enabled) {
    return Object.freeze({
      enabled: false,
      async review() { return blocked('disabled-by-default'); }
    });
  }
  if (typeof keyId !== 'string' || !keyId ||
      !ledger || typeof ledger.consumeOnce !== 'function' ||
      typeof now !== 'function') {
    throw new TypeError('Pinned CPU authority key, atomic replay ledger, and trusted clock required');
  }

  // The key must be pinned from trusted server configuration and consumeOnce
  // must be a durable, atomic one-use operation when enabled outside tests.
  const trustedPublicKey = crypto.createPublicKey(publicKey);
  if (trustedPublicKey.asymmetricKeyType !== 'ed25519') {
    throw new TypeError('Pinned Ed25519 CPU authority public key required');
  }

  function trustedTime() {
    const value = now();
    const milliseconds = value instanceof Date ? value.getTime() : Date.parse(value);
    return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : null;
  }

  function verifySignature(envelope) {
    if (envelope.schema !== CONSENT_SCHEMA || envelope.keyId !== keyId ||
        envelope.digestSchema !== DIGEST_SCHEMA ||
        !['accepted', 'declined'].includes(envelope.cpuDecision) ||
        envelope.decision !== (envelope.cpuDecision === 'accepted' ? 'approve' : 'decline') ||
        typeof envelope.signature !== 'string') return false;
    const {signature, ...payload} = envelope;
    return crypto.verify(
      null,
      Buffer.from(canonicalJson(payload)),
      trustedPublicKey,
      Buffer.from(signature, 'base64url')
    );
  }

  async function review(state, input, revision, envelope, {signal} = {}) {
    if (signal?.aborted) return blocked('cancelled');

    let snapshot;
    let proposal;
    let consent;
    let binding;
    try {
      snapshot = cloneJson(state);
      proposal = cloneJson(input);
      consent = cloneJson(envelope);
      const existing = snapshot.extensions?.tradeDecisionConsents;
      if (existing !== undefined && !Array.isArray(existing)) {
        return blocked('source-validation-failed', 'Invalid receiving-team consent source');
      }
      const incoming = snapshot.universe?.players?.find(player =>
        String(player.id) === String(proposal.incomingPlayerId));
      const digestProbe = {
        receivingTeamId: String(incoming?.teamId ?? ''),
        outgoingPlayerId: String(proposal.outgoingPlayerId ?? ''),
        incomingPlayerId: String(proposal.incomingPlayerId ?? ''),
        decision: 'accepted',
        source: 'receiving-team-authority'
      };
      // The isolated source validator requires a consent-shaped row to calculate
      // the digest. This probe stays in a private clone and is never returned or trusted.
      const digestState = {
        ...snapshot,
        extensions: {
          ...snapshot.extensions,
          tradeDecisionConsents: [...(existing || []), digestProbe]
        }
      };
      binding = await createTradeProposalBinding(digestState, proposal, revision);
    } catch (error) {
      return blocked('source-validation-failed', error.message);
    }

    if (signal?.aborted) return blocked('cancelled');
    const issuedAt = trustedTime();
    if (!issuedAt) return blocked('invalid-trusted-time');
    if (consent?.controlledTeamId !== binding.controlledTeamId ||
        !Array.isArray(consent?.teamIds) ||
        consent.teamIds.length !== 2 ||
        consent.teamIds.map(String).sort().join('|') !==
          [binding.controlledTeamId, binding.receivingTeamId].sort().join('|')) {
      return blocked('binding-mismatch');
    }

    const verified = await evaluateCpuConsent({
      envelope: consent,
      proposalDigest: binding.proposalDigest,
      teamId: binding.receivingTeamId,
      stateRevision: binding.stateRevision,
      now: issuedAt,
      verifier: {verify: verifySignature},
      ledger,
      signal
    });
    if (!verified.accepted) return blocked(verified.reason);
    if (signal?.aborted) return blocked('cancelled');
    const reviewedAt = trustedTime();
    if (!reviewedAt || Date.parse(reviewedAt) < Date.parse(consent.issuedAt) ||
        Date.parse(reviewedAt) >= Date.parse(consent.expiresAt)) {
      return blocked('expired-or-invalid-time');
    }
    if (verified.decision !== 'approve' || consent.cpuDecision !== 'accepted') {
      return blocked('receiving-team-declined');
    }

    const record = Object.freeze({
      decisionId: consent.decisionId,
      proposalDigest: binding.proposalDigest,
      digestSchema: DIGEST_SCHEMA,
      controlledTeamId: binding.controlledTeamId,
      receivingTeamId: binding.receivingTeamId,
      stateRevision: binding.stateRevision,
      outgoingPlayerId: binding.outgoingPlayerId,
      incomingPlayerId: binding.incomingPlayerId,
      decision: 'accepted',
      source: 'receiving-team-authority',
      issuedAt: consent.issuedAt,
      expiresAt: consent.expiresAt,
      verifiedAt: reviewedAt,
      keyId: consent.keyId,
      signature: consent.signature
    });

    const existing = snapshot.extensions?.tradeDecisionConsents;
    const reviewState = {
      ...snapshot,
      extensions: {
        ...snapshot.extensions,
        tradeDecisionConsents: [...(existing || []), record]
      }
    };
    let decision;
    try {
      decision = evaluateTradeReview(reviewState, proposal);
    } catch (error) {
      return blocked('source-validation-failed', error.message);
    }

    return Object.freeze({
      status: 'receiving-consent-record-bridged',
      decision,
      record,
      saved: false,
      settlementAuthorized: false,
      independentlyAuthenticated: true,
      experimental: true
    });
  }

  return Object.freeze({enabled: true, review});
}

module.exports = {createReceivingConsentRecordBridge};
