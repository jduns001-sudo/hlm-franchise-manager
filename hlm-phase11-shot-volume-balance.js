'use strict';
/* Experimental descriptive shot-volume normalization. No production writes or GM actions. */
const {compareSamples}=require('./hlm-phase11-comparable-sample-insights');
const round=n=>Number(n.toFixed(6));
function compareVolumeBalance(homePeriods,awayPeriods,minimumShots=10){
 const base=compareSamples(homePeriods,awayPeriods,minimumShots);
 const total=base.home.shots+base.away.shots;
 const supported=base.comparable&&total>0;
 const share=supported?round(base.home.shots/total):null;
 const imbalance=supported?round(Math.abs(base.home.shots-base.away.shots)/total):null;
 const normalizedGoals=supported?Object.freeze({
  homePerTenShots:round(10*base.home.goals/base.home.shots),
  awayPerTenShots:round(10*base.away.goals/base.away.shots),
  homeExpectedPerTenShots:round(10*base.home.expectedGoals/base.home.shots),
  awayExpectedPerTenShots:round(10*base.away.expectedGoals/base.away.shots)
 }):null;
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,
  requiresGMApproval:true,descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true,
  base,comparable:supported,homeShotShare:share,shotVolumeImbalance:imbalance,normalizedGoals,
  volumeCaution:supported&&imbalance>=.25?'unequal-shot-volume':supported?'volume-context-available':'insufficient-evidence',
  interpretation:supported?'Simulated per-ten-shot rates provide volume context; they do not measure player skill or predict results':
  'Volume-normalized comparisons withheld because one or both samples are insufficient'});
}
module.exports={compareVolumeBalance};
