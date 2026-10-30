'use strict';
const {renderLocalGmTradeReview} = require('./hlm-phase11-local-gm-trade-review');

// Server-side adapter. No browser input may supply proposal assets or auth flags.
async function renderAuthenticatedLocalTradeReview({
  authenticatedSession, bridgeResult, envelope, resolveAuthoritativeReview
} = {}) {
  if (authenticatedSession !== true || typeof resolveAuthoritativeReview !== 'function' ||
      !envelope || typeof envelope !== 'object' ||
      !bridgeResult || bridgeResult.status !== 'receiving-consent-record-bridged' ||
      bridgeResult.independentlyAuthenticated !== true ||
      bridgeResult.saved !== false || bridgeResult.settlementAuthorized !== false ||
      bridgeResult.experimental !== true ||
      bridgeResult.record?.decision !== 'accepted') {
    throw new Error('Authenticated and verified consent required');
  }
  const record = bridgeResult.record;
  if (typeof envelope.proposalDigest !== 'string' ||
      record.proposalDigest !== envelope.proposalDigest ||
      record.stateRevision !== envelope.stateRevision ||
      record.controlledTeamId !== envelope.controlledTeamId ||
      record.receivingTeamId !== envelope.teamId ||
      record.decisionId !== envelope.decisionId ||
      record.expiresAt !== envelope.expiresAt ||
      record.source !== 'receiving-team-authority') {
    throw new Error('Consent record does not match the signed envelope');
  }
  const source = await resolveAuthoritativeReview(envelope.proposalId, envelope.stateRevision);
  if (!source || source.proposalId !== envelope.proposalId ||
      source.stateRevision !== envelope.stateRevision ||
      source.controlledTeamId !== envelope.controlledTeamId ||
      source.teamId !== envelope.teamId ||
      !Array.isArray(source.assets)) {
    throw new Error('Source-backed proposal binding unavailable');
  }
  // The resolver must be server-controlled and must not accept browser-provided assets.
  return renderLocalGmTradeReview({
    authenticated: true,
    independentlyAuthenticated: true,
    experimental: true,
    settlementAuthorized: false,
    saved: false,
    status: bridgeResult.status,
    record: bridgeResult.record,
    proposalId: source.proposalId,
    controlledTeamId: source.controlledTeamId,
    teamId: source.teamId,
    expiresAt: envelope.expiresAt,
    assets: source.assets
  });
}
module.exports = {renderAuthenticatedLocalTradeReview};
