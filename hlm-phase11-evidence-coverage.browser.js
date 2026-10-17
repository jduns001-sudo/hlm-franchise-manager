(function(root){'use strict';
const evaluateTrendAgreement=root.HLMPhase11TrendAgreement.evaluateTrendAgreement;
function reportEvidenceCoverage(homePeriods,awayPeriods,thresholds=[5,10,25]){
 const trend=evaluateTrendAgreement(homePeriods,awayPeriods,thresholds);
 const supported=trend.scenarios.filter(s=>s.fullySupported);
 const unsupported=trend.scenarios.filter(s=>!s.fullySupported);
 const reasons=[...new Set(trend.scenarios.flatMap(s=>s.cautions))];
 const coverageFraction=Number((supported.length/trend.totalThresholds).toFixed(6));
 const coverage=trend.coveredThresholds===0?'none':trend.coveredThresholds===trend.totalThresholds?'complete':'partial';
 const items=trend.scenarios.map(s=>Object.freeze({
  minimumShots:s.minimumShots,status:s.fullySupported?'supported':'withheld',
  direction:s.fullySupported?s.stability:null,
  cautions:Object.freeze([...s.cautions])
 }));
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,
  requiresGMApproval:true,descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true,
  coverage,coverageFraction,supportedThresholds:Object.freeze(supported.map(s=>s.minimumShots)),
  withheldThresholds:Object.freeze(unsupported.map(s=>s.minimumShots)),
  cautionCodes:Object.freeze(reasons),direction:trend.direction,agreement:trend.agreement,
  thresholdSensitivity:trend.thresholdSensitivity,items:Object.freeze(items),
  interpretation:coverage==='complete'?
   'All selected thresholds have sufficient simulated evidence; descriptive trend agreement is not predictive confidence':
   coverage==='partial'?'Some thresholds lack sufficient simulated evidence; do not generalize a direction across all thresholds':
   'No selected threshold has sufficient simulated evidence; direction is withheld'});
}
root.HLMPhase11EvidenceCoverage={reportEvidenceCoverage};
})(globalThis);
