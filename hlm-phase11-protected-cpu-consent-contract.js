'use strict';
// Mission 1456: contract only. Never deploy this as an authentication authority.
const VERSION = 1;
function fail(reason) { return Object.freeze({ accepted: false, reason }); }
function validEnvelope(e) {
  return e && e.version === VERSION &&
    ['decisionId','proposalDigest','teamId','stateRevision','issuedAt','expiresAt','signature','keyId'].every(k => typeof e[k] === 'string' && e[k].length > 0) &&
    ['approve','decline'].includes(e.decision) &&
    Number.isSafeInteger(Date.parse(e.issuedAt)) && Number.isSafeInteger(Date.parse(e.expiresAt)) &&
    Date.parse(e.expiresAt) > Date.parse(e.issuedAt);
}
/**
 * verifier.verify(envelope): independent protected authority; must validate signature,
 * issuer, audience, key rotation and revocation using a trust root outside the browser.
 * ledger.consumeOnce(id, binding): durable transaction/unique constraint with atomic
 * decision-ID consumption and guarded state revision; never use in-memory storage in production.
 * This module is a contract validator, NOT a CPU authorization or settlement endpoint.
 */
async function evaluateCpuConsent({envelope, proposalDigest, teamId, stateRevision, now, verifier, ledger, signal}) {
  if (!validEnvelope(envelope)) return fail('invalid-envelope');
  if (signal?.aborted) return fail('cancelled');
  if (typeof proposalDigest !== 'string' || envelope.proposalDigest !== proposalDigest ||
      envelope.teamId !== teamId || envelope.stateRevision !== stateRevision) return fail('binding-mismatch');
  const time = Date.parse(now);
  if (!Number.isFinite(time) || time < Date.parse(envelope.issuedAt) || time >= Date.parse(envelope.expiresAt)) return fail('expired-or-invalid-time');
  if (!verifier || typeof verifier.verify !== 'function' || !ledger || typeof ledger.consumeOnce !== 'function') return fail('protected-infrastructure-unavailable');
  try {
    if (await verifier.verify(envelope) !== true) return fail('unauthenticated');
    if (signal?.aborted) return fail('cancelled');
    // consumeOnce MUST be an atomic durable operation; never interpret a check-then-insert as safe.
    const consumed = await ledger.consumeOnce(envelope.decisionId, {proposalDigest, teamId, stateRevision});
    if (consumed !== true) return fail('replayed-or-stale');
    return Object.freeze({accepted: true, decision: envelope.decision, decisionId: envelope.decisionId, settlementAuthorized: false});
  } catch (_) { return fail('protected-infrastructure-failure'); }
}
module.exports = {VERSION, validEnvelope, evaluateCpuConsent};
