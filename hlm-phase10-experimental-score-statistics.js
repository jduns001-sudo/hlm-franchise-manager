'use strict';
const { createExperimentalScoreDistribution } = require('./hlm-phase10-experimental-score-distribution');
function createExperimentalScoreStatistics(state, homeTeamId, awayTeamId, seed, sampleCount) {
  const distribution = createExperimentalScoreDistribution(state, homeTeamId, awayTeamId, seed, sampleCount);
  const ready = distribution.researchReady === true;
  const scores = distribution.samples;
  const range = side => scores.reduce((acc,s)=>({min:Math.min(acc.min,s[side]),max:Math.max(acc.max,s[side])}),{min:Infinity,max:-Infinity});
  return {
    kind:'phase10-experimental-score-statistics',
    version:1,
    homeTeamId,awayTeamId,seed,
    researchReady:ready,
    sampleCount:scores.length,
    blockers:distribution.blockers.slice(),
    meanHypotheticalGoals:ready ? {...distribution.meanHypotheticalGoals} : null,
    hypotheticalGoalRange:ready ? {home:range('home'),away:range('away')} : null,
    interpretation:'Descriptive statistics of fictional seeded research samples, not game predictions.',
    simulationAuthorized:false,
    gameResultCreated:false,
    standingsUpdated:false,
    sourceStateMutated:false,
    persistencePerformed:false
  };
}
module.exports = { createExperimentalScoreStatistics };
