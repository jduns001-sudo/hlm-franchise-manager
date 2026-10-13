'use strict';
const { createExperimentalScoreFrequency } = require('./hlm-phase10-experimental-score-frequency');
const { createExperimentalScoreStatistics } = require('./hlm-phase10-experimental-score-statistics');
function createExperimentalFrequencyConsistency(state, homeTeamId, awayTeamId, seed, sampleCount) {
  const frequencies = createExperimentalScoreFrequency(state, homeTeamId, awayTeamId, seed, sampleCount);
  const statistics = createExperimentalScoreStatistics(state, homeTeamId, awayTeamId, seed, sampleCount);
  const ready = frequencies.researchReady === true && statistics.researchReady === true;
  const blockers = [...new Set([...frequencies.blockers,...statistics.blockers])];
  const totals = ready ? Object.fromEntries(['home','away'].map(side=>[
    side,
    frequencies.hypotheticalGoalFrequency[side].reduce((a,row)=>({
      observations:a.observations+row.observations,
      goalSum:a.goalSum+row.goals*row.observations
    }),{observations:0,goalSum:0})
  ])) : null;
  const consistent = ready && ['home','away'].every(side=>
    totals[side].observations===statistics.sampleCount &&
    Math.abs(totals[side].goalSum/totals[side].observations-statistics.meanHypotheticalGoals[side])<1e-10
  );
  return {
    kind:'phase10-experimental-frequency-consistency',
    version:1,homeTeamId,awayTeamId,seed,
    researchReady:ready,
    sampleCount:ready?statistics.sampleCount:0,
    blockers,
    frequencyConsistent:ready?consistent:null,
    observedTotals:totals,
    interpretation:'Read-only consistency audit of fictional score samples; not a game prediction.',
    simulationAuthorized:false,gameResultCreated:false,standingsUpdated:false,
    sourceStateMutated:false,persistencePerformed:false
  };
}
module.exports = { createExperimentalFrequencyConsistency };
