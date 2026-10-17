(function(root){'use strict';
function analyzeThresholdSensitivity(homePeriods,awayPeriods,thresholds=[5,10,25]){
 if(!Array.isArray(thresholds)||!thresholds.length||thresholds.length>12||
    thresholds.some(n=>!Number.isSafeInteger(n)||n<1)||
    new Set(thresholds).size!==thresholds.length)throw RangeError('thresholds must be 1-12 distinct positive safe integers');
 const scenarios=thresholds.map(minimumShots=>{
  const result=root.HLMPhase11EvidenceSynthesis.synthesizeEvidence(homePeriods,awayPeriods,minimumShots);
  return Object.freeze({minimumShots,fullySupported:result.fullySupported,
   cautions:result.cautions,stability:result.stability,
   homeShotShare:result.overall.homeShotShare,
   observedDifferentialChange:result.fullySupported?result.windows.observedDifferentialChange:null});
 });
 const supported=scenarios.filter(x=>x.fullySupported).length;
 const sensitivity=supported===0?'unsupported-at-all-thresholds':supported===scenarios.length?'supported-at-all-thresholds':'threshold-sensitive';
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,
  requiresGMApproval:true,descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true,
  scenarios:Object.freeze(scenarios),sensitivity,
  interpretation:'Threshold sensitivity describes simulated sample sufficiency only; it is not a forecast or GM recommendation'});
}
root.HLMPhase11ThresholdSensitivity={analyzeThresholdSensitivity};
})(globalThis);
