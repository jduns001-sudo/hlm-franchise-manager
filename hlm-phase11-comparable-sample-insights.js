'use strict';
/* Read-only, sample-aware simulated performance comparison. No production state writes. */
const {auditPeriods}=require('./hlm-phase11-sample-quality-audit');
const round=n=>Number(n.toFixed(6));
function compareSamples(homePeriods,awayPeriods,minimumShots=10){
 const home=auditPeriods(homePeriods,minimumShots),away=auditPeriods(awayPeriods,minimumShots);
 const comparable=home.evidence==='sample-supported'&&away.evidence==='sample-supported';
 const reasons=[];
 if(home.evidence!=='sample-supported')reasons.push('home-sample-caution');
 if(away.evidence!=='sample-supported')reasons.push('away-sample-caution');
 const differential=comparable?Object.freeze({
  observedFinishingRate:round(home.observedFinishingRate-away.observedFinishingRate),
  expectedFinishingRate:round(home.expectedFinishingRate-away.expectedFinishingRate),
  shots:home.shots-away.shots,
  goals:home.goals-away.goals
 }):null;
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,
  requiresGMApproval:true,descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true,
  home,away,comparable,reasons:Object.freeze(reasons),differential,
  interpretation:comparable?'Observed simulated differences only; unequal sample sizes may affect interpretation':
  'Comparison suppressed because one or both samples lack sufficient reliable evidence'});
}
module.exports={compareSamples};
