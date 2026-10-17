'use strict';
/* Descriptive agreement only, no production writes or automated GM actions. */
const {analyzeThresholdSensitivity}=require('./hlm-phase11-threshold-sensitivity');
function evaluateTrendAgreement(homePeriods,awayPeriods,thresholds=[5,10,25]){
 const result=analyzeThresholdSensitivity(homePeriods,awayPeriods,thresholds);
 const supported=result.scenarios.filter(x=>x.fullySupported);
 const directions=[...new Set(supported.map(x=>x.stability))];
 const agreement=supported.length===0?'insufficient-evidence':
  supported.length!==result.scenarios.length?'partial-coverage':
  directions.length===1?'consistent':'mixed';
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,
  requiresGMApproval:true,descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true,
  agreement,coveredThresholds:supported.length,totalThresholds:result.scenarios.length,
  direction:agreement==='consistent'?directions[0]:null,
  thresholdSensitivity:result.sensitivity,
  scenarios:result.scenarios,
  interpretation:agreement==='consistent'?'All selected evidence thresholds support the same descriptive early/late direction; this does not imply predictive confidence':
   agreement==='partial-coverage'?'Direction withheld because some selected thresholds lack sufficient evidence':
   agreement==='mixed'?'Direction withheld because supported thresholds disagree':
   'Direction withheld because no selected threshold has sufficient evidence'});
}
module.exports={evaluateTrendAgreement};
