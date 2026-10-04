'use strict';

const ACTIVE_STATE_BACKUP_FORMAT = 'HFM_FRONT_OFFICE_BACKUP';
const ACTIVE_STATE_BACKUP_VERSION = 1;

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createActiveStateBackup(snapshot, metadata = {}) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new TypeError('Front Office snapshot is required');
  }
  const payload = cloneJson(snapshot);
  return Object.freeze({
    format: ACTIVE_STATE_BACKUP_FORMAT,
    version: ACTIVE_STATE_BACKUP_VERSION,
    readOnlySource: true,
    sourceSchema: payload.schema == null ? null : payload.schema,
    createdAt: metadata.createdAt || null,
    label: metadata.label || null,
    payload
  });
}

function validateActiveStateBackup(backup) {
  const errors = [];
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    return { valid: false, errors: ['Backup must be an object'] };
  }
  if (backup.format !== ACTIVE_STATE_BACKUP_FORMAT) errors.push('Unexpected backup format');
  if (backup.version !== ACTIVE_STATE_BACKUP_VERSION) errors.push('Unsupported backup version');
  if (!backup.payload || typeof backup.payload !== 'object' || Array.isArray(backup.payload)) {
    errors.push('Backup payload is required');
  }
  return { valid: errors.length === 0, errors };
}

function restoreCandidateFromBackup(backup) {
  const validation = validateActiveStateBackup(backup);
  if (!validation.valid) {
    const error = new Error(validation.errors.join('; '));
    error.code = 'INVALID_ACTIVE_STATE_BACKUP';
    throw error;
  }
  return cloneJson(backup.payload);
}

module.exports = {
  ACTIVE_STATE_BACKUP_FORMAT,
  ACTIVE_STATE_BACKUP_VERSION,
  createActiveStateBackup,
  validateActiveStateBackup,
  restoreCandidateFromBackup
};
