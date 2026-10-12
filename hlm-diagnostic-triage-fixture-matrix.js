'use strict';

/**
 * Mission 679: controlled fictional diagnostic drift scenarios, not gameplay.
 * Each case starts from a fresh detached Mission 673 regression matrix.
 */
const { createFranchiseDiagnosticRegressionMatrix } = require('./hlm-franchise-diagnostic-regression-matrix');
const { createFranchiseDiagnosticDriftReport } = require('./hlm-franchise-diagnostic-drift-report');
const { createDiagnosticDriftSeverityReport } = require('./hlm-diagnostic-drift-severity');
const { createDiagnosticTriageSummary } = require('./hlm-diagnostic-triage-summary');

const TRIAGE_SCENARIO_NAMES = Object.freeze([
  'clean', 'simulationAuthorization', 'missingCanonicalDiagnostic',
  'rosterCountChange', 'metadataVersionChange', 'mixedPriority'
]);

function createTriageScenarioMatrix(name) {
  if (!TRIAGE_SCENARIO_NAMES.includes(name)) {
    const error = new RangeError('Unknown diagnostic triage scenario: ' + name);
    error.code = 'UNKNOWN_TRIAGE_SCENARIO';
    throw error;
  }
  const matrix = createFranchiseDiagnosticRegressionMatrix();
  switch (name) {
    case 'simulationAuthorization':
      matrix.simulationAuthorized = true;
      break;
    case 'missingCanonicalDiagnostic':
      matrix.rows.find(row => row.fixture === 'invalidIdentities').errorCodes = [];
      break;
    case 'rosterCountChange':
      matrix.rows.find(row => row.fixture === 'clean').candidateCount += 1;
      break;
    case 'metadataVersionChange':
      matrix.version += 1;
      break;
    case 'mixedPriority':
      matrix.simulationAuthorized = true;
      matrix.rows.find(row => row.fixture === 'invalidIdentities').errorCodes = [];
      matrix.rows.find(row => row.fixture === 'clean').candidateCount += 1;
      matrix.version += 1;
      break;
  }
  return matrix;
}

function createDiagnosticTriageFixtureMatrix() {
  const rows = TRIAGE_SCENARIO_NAMES.map(name => {
    const matrix = createTriageScenarioMatrix(name);
    const drift = createFranchiseDiagnosticDriftReport(matrix);
    const severity = createDiagnosticDriftSeverityReport(drift);
    const triage = createDiagnosticTriageSummary(severity);
    return {
      scenario: name,
      hasDrift: drift.hasDrift,
      driftCount: drift.changeCount,
      highestSeverity: triage.highestSeverity,
      severityCounts: { ...triage.counts },
      categoryCount: triage.categoryCount,
      categoryNames: triage.groups.map(group => group.category),
      priorityFields: triage.priorityFindings.map(finding => finding.field),
      simulationAuthorized: false
    };
  });
  return {
    kind: 'franchise-diagnostic-triage-fixture-matrix',
    version: 1,
    scenarioCount: rows.length,
    rows,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = {
  TRIAGE_SCENARIO_NAMES,
  createTriageScenarioMatrix,
  createDiagnosticTriageFixtureMatrix
};
