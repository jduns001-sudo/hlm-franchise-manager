(function(root){'use strict';
function synthesizeEvidence(homePeriods,awayPeriods,minimumShots=10){
 const windows=root.HLMPhase11WindowStabilityInsights.compareWindows(homePeriods,awayPeriods,minimumShots);
 const volume=root.HLMPhase11ShotVolumeBalance.compareVolumeBalance(homePeriods,awayPeriods,minimumShots);
 const fullySupported=windows.comparable&&volume.comparable;
 const cautions=[];
 if(!volume.comparable)cautions.push('overall-sample-insufficient');
 if(!windows.comparable)cautions.push('window-sample-insufficient');
 if(volume.volumeCaution==='unequal-shot-volume')cautions.push('unequal-shot-volume');
 const stability=fullySupported?windows.direction:'insufficient-evidence';
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,
  requiresGMApproval:true,descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true,
  fullySupported,stability,overall:volume,windows,cautions:Object.freeze(cautions),
  interpretation:fullySupported?'Descriptive simulated evidence only; sample volume and early/late change are not predictions':
   'One or more comparisons withheld due to limited simulated evidence'});
}
root.HLMPhase11EvidenceSynthesis={synthesizeEvidence};
})(globalThis);
