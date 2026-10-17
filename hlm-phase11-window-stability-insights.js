'use strict';
/* Experimental read-only early/late sample stability; no GM or save actions. */
const {compareSamples}=require('./hlm-phase11-comparable-sample-insights');
function compareWindows(homePeriods,awayPeriods,minimumShots=10){
 if(!Array.isArray(homePeriods)||!Array.isArray(awayPeriods))throw TypeError('period arrays required');
 const midHome=Math.floor(homePeriods.length/2),midAway=Math.floor(awayPeriods.length/2);
 const early=compareSamples(homePeriods.slice(0,midHome),awayPeriods.slice(0,midAway),minimumShots);
 const late=compareSamples(homePeriods.slice(midHome),awayPeriods.slice(midAway),minimumShots);
 const comparable=early.comparable&&late.comparable;
 const rateChange=comparable?Number((late.differential.observedFinishingRate-early.differential.observedFinishingRate).toFixed(6)):null;
 const direction=rateChange===null?'insufficient-evidence':rateChange>0?'increased':rateChange<0?'decreased':'unchanged';
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,
  requiresGMApproval:true,descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true,
  early,late,comparable,observedDifferentialChange:rateChange,direction,
  interpretation:comparable?'Early-to-late simulated finishing differential only, not a forecast':
   'Early-to-late change suppressed because at least one window has limited evidence'});
}
module.exports={compareWindows};
