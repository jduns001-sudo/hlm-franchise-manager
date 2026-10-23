'use strict';
// Mission 1458: isolated D1 adapter only; not a signer, authentication service or settlement authority.
// D1 batch executes statements in a transaction. A unique decision_id and a guarded
// INSERT ... SELECT make replay and stale revision rejection database-enforced.
const INSERT = `INSERT INTO consumed_cpu_decisions (decision_id, proposal_digest, team_id, state_revision)
 SELECT ?, ?, ?, ? WHERE EXISTS
 (SELECT 1 FROM consent_state_revisions WHERE team_id = ? AND state_revision = ?)`;
function createD1ConsentLedger(db) {
  if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function') throw new TypeError('D1 required');
  return Object.freeze({
    async consumeOnce(decisionId, binding) {
      if (typeof decisionId !== 'string' || !decisionId || !binding ||
          !['proposalDigest', 'teamId', 'stateRevision'].every(k => typeof binding[k] === 'string' && binding[k])) return false;
      try {
        const statement = db.prepare(INSERT).bind(decisionId, binding.proposalDigest,
          binding.teamId, binding.stateRevision, binding.teamId, binding.stateRevision);
        const results = await db.batch([statement]);
        return Array.isArray(results) && results.length === 1 &&
          results[0]?.success === true && results[0]?.meta?.changes === 1;
      } catch (_) { return false; } // Unique-key collision, unavailable DB, or aborted transaction: fail closed.
    }
  });
}
module.exports = {createD1ConsentLedger, INSERT};
