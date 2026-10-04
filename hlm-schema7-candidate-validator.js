'use strict';

function duplicateIds(records, field) {
  const seen = new Set();
  const duplicates = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    const id = record && record[field];
    if (id == null || id === '') continue;
    if (seen.has(String(id))) duplicates.add(String(id));
    seen.add(String(id));
  }
  return Array.from(duplicates).sort();
}

function validateSchema7MigrationCandidate(candidate) {
  const blockers = [];
  const warnings = [];

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return Object.freeze({ valid: false, blockers: Object.freeze(['Migration candidate is required']), warnings: Object.freeze([]) });
  }
  if (candidate.schema !== 7) blockers.push('Migration candidate must use Front Office schema 7');

  const arrays = ['contracts','transactions','draftPicks','prospects','history','waivers'];
  for (const key of arrays) {
    if (candidate[key] != null && !Array.isArray(candidate[key])) blockers.push(key + ' must be an array when present');
  }

  const contractDuplicates = duplicateIds(candidate.contracts, 'id');
  const transactionDuplicates = duplicateIds(candidate.transactions, 'transactionId');
  const pickDuplicates = duplicateIds(candidate.draftPicks, 'pickId');

  if (contractDuplicates.length) blockers.push('Duplicate contract IDs: ' + contractDuplicates.join(', '));
  if (transactionDuplicates.length) blockers.push('Duplicate transaction IDs: ' + transactionDuplicates.join(', '));
  if (pickDuplicates.length) blockers.push('Duplicate draft-pick IDs: ' + pickDuplicates.join(', '));

  if (!candidate.settings || typeof candidate.settings !== 'object') warnings.push('Settings are missing from migration candidate');

  return Object.freeze({
    kind: 'schema7-migration-candidate-validation',
    version: 1,
    valid: blockers.length === 0,
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
    counts: Object.freeze({
      contracts: Array.isArray(candidate.contracts) ? candidate.contracts.length : 0,
      transactions: Array.isArray(candidate.transactions) ? candidate.transactions.length : 0,
      draftPicks: Array.isArray(candidate.draftPicks) ? candidate.draftPicks.length : 0
    }),
    writeAuthorized: false,
    persistenceEnabled: false
  });
}

module.exports = { validateSchema7MigrationCandidate };
