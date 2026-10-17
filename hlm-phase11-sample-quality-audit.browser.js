(function(root){'use strict';
/* Experimental read-only evidence audit. Never writes franchise state or makes GM decisions. */
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
function auditPeriods(periods,minimumShots=10){
 if(!Array.isArray(periods))throw TypeError('periods must be an array');
 if(!Number.isSafeInteger(minimumShots)||minimumShots<1)throw RangeError('minimumShots must be a positive integer');
 let shots=0,goals=0,expectedGoals=0,valid=0,invalid=0,zero=0;
 const warnings=[];
 for(const p of periods){
  if(!p||!finite(p.shots)||!finite(p.goals)||!finite(p.expectedGoals)||p.goals>p.shots||p.expectedGoals>p.shots){
   invalid++;continue;
  }
  valid++;shots+=p.shots;goals+=p.goals;expectedGoals+=p.expectedGoals;
  if(p.shots===0)zero++;
 }
 if(invalid)warnings.push('invalid-periods-excluded');
 if(!valid)warnings.push('no-valid-periods');
 if(shots<minimumShots)warnings.push('limited-shot-sample');
 if(zero)warnings.push('zero-shot-periods');
 const supported=valid>=2&&shots>=minimumShots&&invalid===0;
 return Object.freeze({experimental:true,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  periodCount:periods.length,validPeriods:valid,invalidPeriods:invalid,zeroShotPeriods:zero,
  shots,goals,expectedGoals:Number(expectedGoals.toFixed(6)),
  observedFinishingRate:shots?Number((goals/shots).toFixed(6)):null,
  expectedFinishingRate:shots?Number((expectedGoals/shots).toFixed(6)):null,
  evidence:supported?'sample-supported':'caution',warnings,
  interpretation:'Descriptive simulated samples only. Not a prediction or GM recommendation.'});
}
root.HLMPhase11SampleQualityAudit={auditPeriods};
})(globalThis);
