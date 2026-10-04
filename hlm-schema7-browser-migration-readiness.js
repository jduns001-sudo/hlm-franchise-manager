'use strict';

const { evaluateSchema7CandidateReadiness } = require('./hlm-schema7-candidate-readiness');
const { transformSchema7ToGameState } = require('./hlm-schema7-gamestate-transform');
const { verifyGameStateRoundTrip } = require('./hlm-game-state-serialization');

function evaluateSchema7BrowserMigrationReadiness(snapshot, options = {}) {
  const blockers = [];
  const candidateReadiness = evaluateSchema7CandidateReadiness(snapshot);
  if (!candidateReadiness.ready) blockers.push(...candidateReadiness.blockers);

  let transformed = null;
  let roundTrip = null;
  if (!blockers.length) {
    try {
      transformed = transformSchema7ToGameState(snapshot, options.meta || {});
      if (!transformed.validation.valid) blockers.push('Transformed GameState is invalid');
      if (transformed.sourcePreserved !== true) blockers.push('Source snapshot preservation failed');
      roundTrip = verifyGameStateRoundTrip(transformed.state);
      if (!roundTrip.valid) blockers.push('Canonical GameState round-trip failed');
    } catch (error) {
      blockers.push(error && error.message ? error.message : 'GameState readiness evaluation failed');
    }
  }

  return Object.freeze({
    kind: 'schema7-browser-migration-readiness',
    version: 1,
    ready: blockers.length === 0,
    blockers: Object.freeze(blockers),
    sourceSchema: snapshot && snapshot.schema || null,
    targetSchemaVersion: transformed && transformed.state.schemaVersion || null,
    sourcePreserved: Boolean(transformed && transformed.sourcePreserved),
    roundTripVerified: Boolean(roundTrip && roundTrip.valid),
    writeAuthorized: false,
    persistenceEnabled: false,
    sourceMutationAllowed: false,
    sourceDeletionAllowed: false
  });
}

module.exports = { evaluateSchema7BrowserMigrationReadiness };
