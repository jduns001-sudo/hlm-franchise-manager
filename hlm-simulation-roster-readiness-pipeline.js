'use strict';

/**
 * Mission 668: pure composition of canonical bridge, roster eligibility and
 * readiness diagnostics. No persistence, UI wiring, or simulation decisions.
 */
const { createCanonicalFranchiseBridgeSnapshot } = require('./hlm-canonical-franchise-bridge');
const { assessSimulationRosterEligibility } = require('./hlm-simulation-roster-eligibility');
const { createSimulationRosterReadinessReport } = require('./hlm-simulation-roster-readiness');

function createSimulationRosterReadinessPipeline(universe, roster, options = {}) {
  const bridge = createCanonicalFranchiseBridgeSnapshot(universe, roster, options);
  const eligibility = assessSimulationRosterEligibility(bridge);
  const readiness = createSimulationRosterReadinessReport(eligibility);
  return {
    kind: 'simulation-roster-readiness-pipeline',
    version: 1,
    bridge,
    eligibility,
    readiness,
    validation: { ...bridge.validation },
    // Preserve the canonical bridge's validation gate. An informational
    // candidate is never an eligible player or an authorization to simulate.
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createSimulationRosterReadinessPipeline };
