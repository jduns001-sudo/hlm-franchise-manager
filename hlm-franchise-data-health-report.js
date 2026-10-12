'use strict';

/**
 * Mission 670: detached franchise data health view over the existing
 * canonical/eligibility/readiness diagnostics. No gameplay or persistence.
 */
const { createSimulationRosterReadinessPipeline } = require('./hlm-simulation-roster-readiness-pipeline');
const { createRosterReadinessValidationSummary } = require('./hlm-roster-readiness-validation-summary');

function createFranchiseDataHealthReport(universe, roster, options = {}) {
  const pipeline = createSimulationRosterReadinessPipeline(universe, roster, options);
  const validationSummary = createRosterReadinessValidationSummary(pipeline);
  const readiness = pipeline.readiness;
  return {
    kind: 'franchise-data-health-report',
    version: 1,
    dataQuality: {
      valid: validationSummary.dataQuality.valid,
      reportedIssueCount: validationSummary.dataQuality.reportedIssueCount,
      errors: validationSummary.dataQuality.errors.map(issue => ({ ...issue }))
    },
    warnings: {
      organization: validationSummary.warnings.organization.map(issue => ({ ...issue })),
      readiness: validationSummary.warnings.readiness.map(issue => ({ ...issue })),
      count: validationSummary.warnings.count
    },
    roster: {
      summary: { ...readiness.summary },
      teams: readiness.teams.map(team => ({
        teamId: team.teamId,
        associatedCount: team.associatedCount,
        candidateCount: team.candidateCount,
        excludedCount: team.excludedCount,
        undeterminedAssociatedCount: team.undeterminedAssociatedCount,
        issues: team.issues.slice(),
        rosterSufficiency: team.rosterSufficiency,
        gameReady: team.gameReady
      })),
      unresolvedByStatus: { ...readiness.unresolvedByStatus }
    },
    // This report is descriptive only. Even valid data does not prove a
    // lineup or simulation is ready.
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createFranchiseDataHealthReport };
