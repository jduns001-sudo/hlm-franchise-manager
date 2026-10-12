'use strict';

/**
 * Mission 669: separate existing canonical data diagnostics from advisory
 * roster readiness warnings without weakening validation or authorizing games.
 */
function createRosterReadinessValidationSummary(pipeline) {
  if (!pipeline || pipeline.kind !== 'simulation-roster-readiness-pipeline' ||
      !pipeline.bridge || !Array.isArray(pipeline.bridge.diagnostics) ||
      !pipeline.bridge.validation || typeof pipeline.bridge.validation.valid !== 'boolean' ||
      !pipeline.readiness || !Array.isArray(pipeline.readiness.teams) ||
      !Array.isArray(pipeline.readiness.unresolvedPlayers)) {
    const error = new Error('A Mission 668 roster readiness pipeline is required');
    error.code = 'INVALID_READINESS_VALIDATION_INPUT';
    throw error;
  }

  const dataQualityErrors = pipeline.bridge.diagnostics.map(issue => ({ ...issue }));
  const organizationWarnings = (pipeline.bridge.organizationDiagnostics || []).map(issue => ({
    ...issue,
    category: 'organization-reference-warning'
  }));
  const readinessWarnings = pipeline.readiness.teams.flatMap(team =>
    team.issues.map(code => ({ code, teamId: team.teamId, category: 'readiness-warning' }))
  );
  const unresolvedWarnings = pipeline.readiness.unresolvedPlayers.map(player => ({
    code: 'UNRESOLVED_PLAYER_ORGANIZATION',
    playerId: player.playerId,
    teamId: player.teamId,
    organizationStatus: player.organizationStatus,
    category: 'readiness-warning'
  }));

  return {
    kind: 'roster-readiness-validation-summary',
    version: 1,
    dataQuality: {
      valid: pipeline.bridge.validation.valid,
      reportedIssueCount: pipeline.bridge.validation.issueCount,
      errors: dataQualityErrors
    },
    warnings: {
      organization: organizationWarnings,
      readiness: [...readinessWarnings, ...unresolvedWarnings],
      count: organizationWarnings.length + readinessWarnings.length + unresolvedWarnings.length
    },
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterReadinessValidationSummary };
