'use strict';

const { LEGACY_STORAGE_KEY } = require('./hlm-browser-persistence-integration');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { createAtomicPersistencePlan, validateAtomicPersistencePlan } = require('./hlm-atomic-persistence');

function inspectRuntimeMigrationReadiness(storage, slotId = 'primary') {
  if (!storage || typeof storage.getItem !== 'function') throw new TypeError('Web Storage-compatible storage is required');
  const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
  const newRaw = storage.getItem(DEFAULT_STORAGE_KEY);
  const report = {
    ready: false, slotId, legacyKey: LEGACY_STORAGE_KEY, newSaveKey: DEFAULT_STORAGE_KEY,
    legacyPresent: legacyRaw !== null, newSaveNamespacePresent: newRaw !== null,
    legacyValidJson: false, planValid: false, blockers: [], warnings: []
  };
  if (legacyRaw === null) { report.blockers.push('LEGACY_SOURCE_NOT_FOUND'); return report; }
  let legacy;
  try { legacy = JSON.parse(legacyRaw); report.legacyValidJson = true; }
  catch (_) { report.blockers.push('INVALID_LEGACY_SOURCE_JSON'); return report; }
  try {
    const plan = createAtomicPersistencePlan(legacy, { saveId: slotId });
    const check = validateAtomicPersistencePlan(plan);
    report.planValid = check.valid;
    if (!check.valid) report.blockers.push('ATOMIC_PERSISTENCE_PLAN_INVALID');
  } catch (error) {
    report.blockers.push(error.code || 'MIGRATION_PREPARATION_FAILED');
  }
  if (newRaw !== null) report.warnings.push('NEW_SAVE_NAMESPACE_ALREADY_PRESENT');
  report.ready = report.blockers.length === 0 && report.planValid;
  return report;
}

module.exports = { inspectRuntimeMigrationReadiness };
