'use strict';

const { createPermanentId, validPermanentId, auditRecordIdentities } = require('./hlm-record-identity');

function stableContractToken(contract, sourceIndex) {
  if (!contract || typeof contract !== 'object') throw new Error('INVALID_CONTRACT_RECORD');
  if (!Number.isInteger(sourceIndex) || sourceIndex < 0) throw new Error('INVALID_CONTRACT_SOURCE_INDEX');

  const player = contract.playerId ?? contract.playerID ?? 'unknown-player';
  const team = contract.teamId ?? contract.teamID ?? 'unknown-team';
  const start = contract.startYear ?? contract.startSeason ?? contract.startDate ?? 'unknown-start';
  return ['legacy', player, team, start, sourceIndex].map(value =>
    String(value).trim().replace(/[^A-Za-z0-9_-]+/g, '_')
  ).join('_');
}

function migrateContractIdentities(contracts) {
  const source = Array.isArray(contracts) ? contracts : [];
  const migrated = source.map((contract, index) => {
    const copy = contract && typeof contract === 'object' ? { ...contract } : {};
    if (validPermanentId(copy.contractId, 'contract')) return copy;
    copy.contractId = createPermanentId('contract', stableContractToken(copy, index));
    return copy;
  });

  const audit = auditRecordIdentities(migrated, 'contract', 'contractId');
  if (audit.migrationRequired) {
    const error = new Error('CONTRACT_ID_MIGRATION_FAILED');
    error.code = 'CONTRACT_ID_MIGRATION_FAILED';
    error.audit = audit;
    throw error;
  }

  return {
    contracts: migrated,
    audit,
    changed: migrated.reduce((count, record, index) =>
      count + (record.contractId !== (source[index] && source[index].contractId) ? 1 : 0), 0)
  };
}

module.exports = { stableContractToken, migrateContractIdentities };
