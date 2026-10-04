'use strict';

const {
  createActiveStateBackup,
  validateActiveStateBackup,
  restoreCandidateFromBackup
} = require('./hlm-active-state-backup-contract');

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
    return out;
  }
  return value;
}

function fingerprint(value) {
  return JSON.stringify(stable(value));
}

function verifyActiveStateBackupRoundTrip(snapshot, metadata = {}) {
  const backup = createActiveStateBackup(snapshot, metadata);
  const validation = validateActiveStateBackup(backup);
  if (!validation.valid) {
    return Object.freeze({ verified: false, validation, sourceFingerprint: null, restoredFingerprint: null });
  }
  const restored = restoreCandidateFromBackup(backup);
  const sourceFingerprint = fingerprint(snapshot);
  const restoredFingerprint = fingerprint(restored);
  return Object.freeze({
    kind: 'active-state-backup-roundtrip-verification',
    version: 1,
    verified: sourceFingerprint === restoredFingerprint,
    validation,
    sourceFingerprint,
    restoredFingerprint,
    backup
  });
}

module.exports = { fingerprint, verifyActiveStateBackupRoundTrip };
