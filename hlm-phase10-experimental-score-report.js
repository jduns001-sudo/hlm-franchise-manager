'use strict';
const { createExperimentalScoreStatistics } = require('./hlm-phase10-experimental-score-statistics');
const { createExperimentalFrequencyConsistency } = require('./hlm-phase10-experimental-frequency-consistency');
function createExperimentalScoreReport(state, homeTeamId, awayTeamId, seed, sampleCount) {
  const statistics = createExperimentalScoreStatistics(state, homeTeamId, awayTeamId, seed, sampleCount);
  const audit = createExperimentalFrequencyConsistency(state, homeTeamId, awayTeamId, seed, sampleCount);
  const ready = statistics.researchReady === true && audit.researchReady === true && audit.frequencyConsistent === true;
  const blockers = [...new Set([...statistics.blockers,...audit.blockers])];
  if (statistics.researchReady && audit.researchReady && !audit.frequencyConsistent) blockers.push('INCONSISTENT_HYPOTHETICAL_SAMPLE_FREQUENCY');
  return {
    kind:'phase10-experimental-score-report',
    version:1,homeTeamId,awayTeamId,seed,
    researchReady:ready,
    sampleCount:ready?statistics.sampleCount:0,
    blockers,
    meanHypotheticalGoals:ready?{...statistics.meanHypotheticalGoals}:null,
    hypotheticalGoalRange:ready?{home:{...statistics.hypotheticalGoalRange.home},away:{...statistics.hypotheticalGoalRange.away}}:null,
    frequencyConsistent:ready?true:null,
    interpretation:'Research-only fictional score samples, not calibrated predictions or official games.',
    simulationAuthorized:false,gameResultCreated:false,standingsUpdated:false,
    sourceStateMutated:false,persistencePerformed:false
  };
}
module.exports = { createExperimentalScoreReport };
