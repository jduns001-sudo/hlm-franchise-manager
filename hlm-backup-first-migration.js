'use strict';

const { prepareLegacyMigration } = require('./hlm-legacy-migration-orchestrator');
const { exportGameState, inspectGameStateImport } = require('./hlm-save-transfer');

function createBackupFirstMigrationPackage(legacy, meta = {}) {
  const prepared = prepareLegacyMigration(legacy, meta);
  if (!prepared.readyForPersistencePlanning) {
    const error = new Error('Migration preparation is not ready');
    error.code = 'MIGRATION_NOT_READY';
    error.diagnostics = prepared;
    throw error;
  }

  const backupText = exportGameState(prepared.state, {
    saveId: meta.saveId || null,
    label: meta.label || 'Pre-persistence migration backup',
    gameDate: prepared.state.meta.currentDate,
    controlledTeamId: prepared.state.meta.controlledTeamId
  });
  const inspection = inspectGameStateImport(backupText);
  if (!inspection.valid) {
    const error = new Error('Migration backup failed validation');
    error.code = 'MIGRATION_BACKUP_INVALID';
    error.inspection = inspection;
    throw error;
  }

  return {
    state: prepared.state,
    backupText,
    backupInspection: inspection,
    prepared,
    persistenceAllowed: false,
    persistencePerformed: false
  };
}

module.exports = { createBackupFirstMigrationPackage };
