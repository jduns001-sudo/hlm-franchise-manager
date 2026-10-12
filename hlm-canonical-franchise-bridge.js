'use strict';

/**
 * Mission 663: pure composition of the existing canonical Player resolver,
 * GameState envelope, and Mission 662 identity bridge.
 *
 * No browser storage, mutation of source data, or live application wiring.
 */
const { buildCanonicalPlayerSnapshot, validateCanonicalPlayerSnapshot } = require('./hlm-canonical-player-snapshot');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createFranchiseSimulationSnapshot } = require('./hlm-franchise-simulation-data-bridge');
const { createOrganizationReferenceClassifier } = require('./hlm-organization-reference-classifier');

function createCanonicalFranchiseBridgeSnapshot(universe, roster, options = {}) {
  const canonical = buildCanonicalPlayerSnapshot(universe, roster, {
    playerFixes: options.playerFixes,
    playerOverrides: options.playerOverrides
  });
  const canonicalValidation = validateCanonicalPlayerSnapshot(canonical);
  const diagnostics = [];
  if (!canonicalValidation.valid) {
    diagnostics.push(...canonicalValidation.errors.map(issue => ({ ...issue, stage: 'canonical' })));
  }
  // Duplicate Universe identities must not be silently treated as valid merely
  // because the canonical registry retained the first occurrence.
  for (const playerId of canonical.diagnostics.duplicateUniverseIds) {
    diagnostics.push({ code: 'DUPLICATE_UNIVERSE_PLAYER_ID', stage: 'canonical', playerId });
  }
  for (const sourceIndex of canonical.diagnostics.invalidUniversePlayers.map(row => row.sourceIndex)) {
    diagnostics.push({ code: 'INVALID_UNIVERSE_PLAYER', stage: 'canonical', sourceIndex });
  }
  for (const playerId of canonical.diagnostics.rosterIdsMissingUniverse) {
    diagnostics.push({ code: 'ROSTER_PLAYER_MISSING_UNIVERSE', stage: 'canonical', playerId });
  }

  const teams = Array.isArray(universe && universe.teams) ? universe.teams : [];
  // createGameStateEnvelope clones all incoming rows. The Phase 662 bridge
  // only sees resolved canonical players, never historical roster duplicates.
  const state = createGameStateEnvelope({
    teams,
    players: canonical.players
  });
  const bridge = createFranchiseSimulationSnapshot(state);
  const organizationClassifier = createOrganizationReferenceClassifier(state.universe.teams);
  // Classification is informational: it never changes teamId, membership,
  // free-agent eligibility, or the existing validation gate.
  const classifiedPlayers = bridge.players.map(player => ({
    ...player,
    organizationReference: organizationClassifier.classify(player.teamId)
  }));
  return {
    kind: 'canonical-franchise-bridge-snapshot',
    version: 1,
    teams: bridge.teams,
    players: classifiedPlayers,
    provenanceByPlayerId: new Map([...canonical.provenanceByPlayerId].map(([id, provenance]) => [id, JSON.parse(JSON.stringify(provenance))])),
    canonicalSummary: { ...canonical.summary },
    organizationDiagnostics: organizationClassifier.diagnostics.map(issue => ({ ...issue })),
    diagnostics: [...diagnostics, ...bridge.diagnostics.map(issue => ({ ...issue, stage: 'bridge' }))],
    validation: {
      valid: diagnostics.length === 0 && bridge.validation.valid,
      issueCount: diagnostics.length + bridge.diagnostics.length
    },
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createCanonicalFranchiseBridgeSnapshot };
