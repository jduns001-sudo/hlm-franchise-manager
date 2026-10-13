'use strict';
const { createExperimentalReadinessAudit } = require('./hlm-phase10-experimental-readiness-audit');
const { createExperimentalResearchReport } = require('./hlm-phase10-experimental-research-report');
function samplePoisson(mean, next) {
  if (!Number.isFinite(mean) || mean < 0 || mean > 20) throw new RangeError('Invalid research goal mean');
  const threshold = Math.exp(-mean);
  let product = 1;
  for (let k = 0; k < 1000; k++) {
    product *= next();
    if (product <= threshold) return k;
  }
  throw new RangeError('Sampling iteration limit reached');
}
function createExperimentalSimulationDryRun(state, homeTeamId, awayTeamId, seed) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be an unsigned 32-bit integer');
  const audit = createExperimentalReadinessAudit(state, homeTeamId, awayTeamId);
  const report = createExperimentalResearchReport(state, homeTeamId, awayTeamId);
  const blockers = [...new Set([...audit.blockers, ...report.blockers])];
  const means = report.expectedGoals;
  const validMeans = !!means && ['home','away'].every(side => Number.isFinite(means[side]) && means[side] >= 0 && means[side] <= 20);
  if (!validMeans && audit.researchReady) blockers.push('INVALID_RESEARCH_GOAL_MEANS');
  const ready = audit.researchReady === true && report.researchEvidenceReady === true && validMeans;
  let hypotheticalScore = null;
  if (ready) {
    let state32 = seed >>> 0;
    const next = () => {
      state32 = (Math.imul(1664525, state32) + 1013904223) >>> 0;
      return (state32 + 0.5) / 4294967296;
    };
    hypotheticalScore = { home: samplePoisson(means.home, next), away: samplePoisson(means.away, next) };
  }
  return {
    kind: 'phase10-experimental-simulation-dry-run',
    version: 1,
    homeTeamId,
    awayTeamId,
    seed,
    researchReady: ready,
    blockers,
    hypotheticalScore,
    interpretation: 'Fictional seeded research dry run only. Not an official game result.',
    simulationAuthorized: false,
    gameResultCreated: false,
    standingsUpdated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { createExperimentalSimulationDryRun };
