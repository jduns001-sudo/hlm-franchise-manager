'use strict';
const { createExperimentalSimulationDryRun } = require('./hlm-phase10-experimental-simulation-dry-run');
const MAX_SAMPLES = 256;
function createExperimentalScoreDistribution(state, homeTeamId, awayTeamId, seed, sampleCount) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be unsigned 32-bit integer');
  if (!Number.isSafeInteger(sampleCount) || sampleCount < 1 || sampleCount > MAX_SAMPLES) throw new RangeError('Sample count must be between 1 and 256');
  const first = createExperimentalSimulationDryRun(state, homeTeamId, awayTeamId, seed);
  const ready = first.researchReady === true && first.hypotheticalScore !== null;
  const samples = [];
  if (ready) {
    for (let i=0;i<sampleCount;i++) {
      const derivedSeed = (seed + Math.imul(i, 2654435761)) >>> 0;
      const run = i===0 ? first : createExperimentalSimulationDryRun(state, homeTeamId, awayTeamId, derivedSeed);
      if (!run.researchReady || !run.hypotheticalScore) throw new Error('Research evidence changed during pure sampling');
      samples.push({home:run.hypotheticalScore.home,away:run.hypotheticalScore.away});
    }
  }
  const total = samples.reduce((acc,s)=>({home:acc.home+s.home,away:acc.away+s.away}),{home:0,away:0});
  return {
    kind: 'phase10-experimental-score-distribution',
    version: 1,
    homeTeamId,awayTeamId,seed,
    requestedSampleCount:sampleCount,
    researchReady:ready,
    blockers:first.blockers.slice(),
    samples,
    meanHypotheticalGoals:ready ? {home:total.home/samples.length,away:total.away/samples.length} : null,
    interpretation:'Fictional research samples only, not official game outcomes or predictions.',
    simulationAuthorized:false,
    gameResultCreated:false,
    standingsUpdated:false,
    sourceStateMutated:false,
    persistencePerformed:false
  };
}
module.exports = { createExperimentalScoreDistribution, MAX_SAMPLES };
