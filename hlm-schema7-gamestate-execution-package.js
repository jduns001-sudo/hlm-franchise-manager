'use strict';

const { createSchema7MigrationExecutionPackage } = require('./hlm-schema7-migration-execution-package');
const { transformSchema7ToGameState } = require('./hlm-schema7-gamestate-transform');
const { validateGameStateEnvelope } = require('./hlm-game-state');

function createSchema7GameStateExecutionPackage(snapshot, authorization, options = {}) {
  const base = createSchema7MigrationExecutionPackage(snapshot, authorization, options);
  if (!base.executable || !base.candidate) {
    return Object.freeze({
      ...base,
      candidate: null,
      transformed: false,
      gameStateValid: false
    });
  }

  const transformed = transformSchema7ToGameState(base.candidate, options.meta || {});
  const validation = validateGameStateEnvelope(transformed.state);
  if (!validation.valid || !transformed.sourcePreserved) {
    return Object.freeze({
      ...base,
      executable: false,
      candidate: null,
      transformed: true,
      gameStateValid: validation.valid,
      blockers: Object.freeze([
        ...(base.blockers || []),
        ...validation.errors.map(error => error.code),
        ...(transformed.sourcePreserved ? [] : ['SOURCE_SNAPSHOT_NOT_PRESERVED'])
      ])
    });
  }

  return Object.freeze({
    ...base,
    candidate: transformed.state,
    transformed: true,
    gameStateValid: true,
    sourceSchema: 7,
    targetSchemaVersion: transformed.state.schemaVersion
  });
}

module.exports = { createSchema7GameStateExecutionPackage };
