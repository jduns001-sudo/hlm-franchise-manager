'use strict';

/**
 * Phase 1 Mission 7: permanent identity foundation for NEW mutable records.
 * Legacy records without IDs are diagnosed, never silently assigned IDs here.
 */

const PREFIXES = Object.freeze({
  contract: 'CON',
  transaction: 'TXN'
});

function validPermanentId(value, kind) {
  const prefix = PREFIXES[kind];
  return Boolean(prefix && typeof value === 'string' &&
    new RegExp('^' + prefix + '-[A-Za-z0-9][A-Za-z0-9_-]*$').test(value));
}

function createPermanentId(kind, token) {
  const prefix = PREFIXES[kind];
  if (!prefix) throw new Error('unsupported identity kind');
  const clean = String(token == null ? '' : token).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(clean)) throw new Error('stable token required');
  return prefix + '-' + clean;
}

function auditRecordIdentities(records, kind, idField) {
  const rows = Array.isArray(records) ? records : [];
  const seen = new Map();
  const missing = [];
  const invalid = [];
  const duplicates = [];

  rows.forEach((record, index) => {
    const value = record && record[idField];
    if (value === undefined || value === null || value === '') {
      missing.push({ index });
      return;
    }
    if (!validPermanentId(value, kind)) {
      invalid.push({ index, value });
      return;
    }
    if (seen.has(value)) {
      duplicates.push({ id: value, firstIndex: seen.get(value), index });
      return;
    }
    seen.set(value, index);
  });

  return {
    kind,
    idField,
    total: rows.length,
    identified: seen.size,
    missing,
    invalid,
    duplicates,
    migrationRequired: missing.length > 0 || invalid.length > 0 || duplicates.length > 0
  };
}

function auditMutableRecordIdentity(db) {
  return {
    contracts: auditRecordIdentities(db && db.contracts, 'contract', 'contractId'),
    transactions: auditRecordIdentities(db && db.transactions, 'transaction', 'transactionId')
  };
}

module.exports = {
  PREFIXES,
  validPermanentId,
  createPermanentId,
  auditRecordIdentities,
  auditMutableRecordIdentity
};
