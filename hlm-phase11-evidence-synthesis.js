'use strict';
/* Read-only evidence synthesis across existing experimental sample, window and volume modules. */
const {compareWindows}=require('./hlm-phase11-window-stability-insights');
const {compareVolumeBalance}=require('./hlm-phase11-shot-volume-balance');
function synthesizeEvidence(homePeriods,awayPeriods,minimumShots=10){
 const windows=compareWindows(homePeriods,awayPeriods,minimumShots);
 const volume=compareVolumeBalance(homePeriods,awayPeriods,minimumShots);
 const fullySupported=windows.comparable&&volume.comparable;
 const cautions=[];
 if(!volume.comparable)cautions.push('overall-sample-insufficient');
 if(!windows.comparable)cautions.push('window-sample-insufficient');
 if(volume.volumeCaution==='unequal-shot-volume')cautions.push('unequal-shot-volume');
 const stability=fullySupported?windows.direction:'insufficient-evidence';
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,
  requiresGMApproval:true,descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true,
  fullySupported,stability,overall:volume,windows,
  cautions:Object.freeze(cautions),
  interpretation:fullySupported?'Descriptive simulated evidence only; sample volume and early/late change are not predictions':
   'One or more comparisons withheld due to limited simulated evidence'});
}
module.exports={synthesizeEvidence};
