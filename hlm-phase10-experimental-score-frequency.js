'use strict';
const { createExperimentalScoreDistribution } = require('./hlm-phase10-experimental-score-distribution');
function createExperimentalScoreFrequency(state, homeTeamId, awayTeamId, seed, sampleCount) {
  const distribution = createExperimentalScoreDistribution(state, homeTeamId, awayTeamId, seed, sampleCount);
  const ready = distribution.researchReady === true;
  const count = side => {
    const frequencies = new Map();
    for (const score of distribution.samples) frequencies.set(score[side], (frequencies.get(score[side]) || 0) + 1);
    return [...frequencies.entries()].sort((a,b)=>a[0]-b[0]).map(([goals,observations])=>({goals,observations}));
  };
  return {
    kind:'phase10-experimental-score-frequency',
    version:1,
    homeTeamId,awayTeamId,seed,
    researchReady:ready,
    sampleCount:distribution.samples.length,
    blockers:distribution.blockers.slice(),
    hypotheticalGoalFrequency:ready ? {home:count('home'),away:count('away')} : null,
    interpretation:'Observed frequencies of fictional seeded samples only; not calibrated probabilities or official outcomes.',
    simulationAuthorized:false,
    gameResultCreated:false,
    standingsUpdated:false,
    sourceStateMutated:false,
    persistencePerformed:false
  };
}
module.exports = { createExperimentalScoreFrequency };
