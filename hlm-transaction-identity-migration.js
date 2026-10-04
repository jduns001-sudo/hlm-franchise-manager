'use strict';

const { createPermanentId, validPermanentId, auditRecordIdentities } = require('./hlm-record-identity');

function stableTransactionToken(transaction, sourceIndex) {
  if (!transaction || typeof transaction !== 'object') throw new Error('INVALID_TRANSACTION_RECORD');
  if (!Number.isInteger(sourceIndex) || sourceIndex < 0) throw new Error('INVALID_TRANSACTION_SOURCE_INDEX');

  const player = transaction.playerId ?? transaction.playerID ?? 'unknown-player';
  const team = transaction.teamId ?? transaction.teamID ?? transaction.toTeamId ?? 'unknown-team';
  const date = transaction.date ?? transaction.transactionDate ?? transaction.season ?? 'unknown-date';
  const type = transaction.type ?? transaction.transactionType ?? 'unknown-type';

  return ['legacy', player, team, date, type, sourceIndex].map(value =>
    String(value).trim().replace(/[^A-Za-z0-9_-]+/g, '_')
  ).join('_');
}

function migrateTransactionIdentities(transactions) {
  const source = Array.isArray(transactions) ? transactions : [];
  const migrated = source.map((transaction, index) => {
    const copy = transaction && typeof transaction === 'object' ? { ...transaction } : {};
    if (validPermanentId(copy.transactionId, 'transaction')) return copy;
    copy.transactionId = createPermanentId('transaction', stableTransactionToken(copy, index));
    return copy;
  });

  const audit = auditRecordIdentities(migrated, 'transaction', 'transactionId');
  if (audit.migrationRequired) {
    const error = new Error('TRANSACTION_ID_MIGRATION_FAILED');
    error.code = 'TRANSACTION_ID_MIGRATION_FAILED';
    error.audit = audit;
    throw error;
  }

  return {
    transactions: migrated,
    audit,
    changed: migrated.reduce((count, record, index) =>
      count + (record.transactionId !== (source[index] && source[index].transactionId) ? 1 : 0), 0)
  };
}

module.exports = { stableTransactionToken, migrateTransactionIdentities };
