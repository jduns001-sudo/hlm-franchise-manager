'use strict';

const { verifyActiveStateBackupRoundTrip } = require('./hlm-active-state-backup-roundtrip');

function evaluateActiveStateBackupReadiness(snapshot, metadata = {}) {
  const blockers = [];
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return Object.freeze({ ready: false, blockers: Object.freeze(['Front Office snapshot is required']) });
  }
  if (snapshot.schema !== 7) blockers.push('Front Office schema 7 is required');

  let roundTrip = null;
  try {
    roundTrip = verifyActiveStateBackupRoundTrip(snapshot, metadata);
    if (!roundTrip.verified) blockers.push('Backup round-trip verification failed');
  } catch (error) {
    blockers.push('Backup creation failed: ' + (error && error.message ? error.message : 'unknown error'));
  }

  return Object.freeze({
    kind: 'active-state-backup-readiness-gate',
    version: 1,
    ready: blockers.length === 0,
    sourceSchema: snapshot.schema == null ? null : snapshot.schema,
    backupVerified: Boolean(roundTrip && roundTrip.verified),
    writeAuthorized: false,
    persistenceEnabled: false,
    blockers: Object.freeze(blockers),
    backup: roundTrip && roundTrip.verified ? roundTrip.backup : null
  });
}

module.exports = { evaluateActiveStateBackupReadiness };
