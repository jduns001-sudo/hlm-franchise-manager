'use strict';
function evaluatePhase5ExitGate(input={}){
 const automated=input.automated||{};const physical=input.physical||{};
 const requiredAutomated=['simulationInputBoundary','teamStrengthInputs','coreGameplayEvents','coreGameplayProfile','specialTeamsPenaltiesSituations','performanceInjuryOutputs','deterministicGameLoop','gameResultTransaction','timelineIntegration','persistenceBridge','sourceStateImmutability','deterministicReplay'];
 const requiredPhysical=['frontOfficeLoads','controlledTeamWorks','existingFranchiseScreensWork','saveReloadWorks','noNewConsoleErrors','githubPagesFunctional'];
 const blockers=[];for(const key of requiredAutomated)if(automated[key]!==true)blockers.push('AUTOMATED_CHECK_REQUIRED:'+key);for(const key of requiredPhysical)if(physical[key]!==true)blockers.push('PHYSICAL_CHECK_REQUIRED:'+key);
 const ready=blockers.length===0;return Object.freeze({kind:'phase5-exit-gate',version:1,phase:5,phaseName:'Game simulation engine',ready,
  automatedChecksPassed:requiredAutomated.every(k=>automated[k]===true),physicalChecksPassed:requiredPhysical.every(k=>physical[k]===true),
  phase6MayBegin:ready,nextPhase:ready?6:null,nextPhaseName:ready?'Franchise management':null,blockers:Object.freeze(blockers),requiredAutomated:Object.freeze(requiredAutomated.slice()),requiredPhysical:Object.freeze(requiredPhysical.slice())});
}
module.exports={evaluatePhase5ExitGate};
