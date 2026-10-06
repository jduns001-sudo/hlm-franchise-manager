'use strict';
function evaluatePhase3ExitGate(input={}){
 const automated=input.automated||{},physical=input.physical||{};
 const requiredAutomated=[
  'masterCalendar','seasonPhaseTimeline','calendarEvents','dailyTick',
  'advanceThreeDays','advanceWeek','advanceMonth','nextGame','nextEvent','simulateSeason',
  'stopRules','eventPriorities','unifiedCommandPlanning','unifiedCommandAuthorization',
  'unifiedCalendarExecution','unifiedCalendarVerification','unifiedGameStateIntegration',
  'unifiedPersistence','safeReplacement','replacementCloseout','saveReloadIntegrity'
 ];
 const requiredPhysical=[
  'frontOfficeLoads','teamSelectionWorks','rosterWorks','linesWork','playerInformationCorrect',
  'contractsWork','draftPicksCorrect','prospectsWork','noConsoleErrors','saveSucceeds',
  'reloadSucceeds','stateUnchangedAfterReload','noUnrelatedScreensBroken','githubPagesFunctional'
 ];
 const blockers=[];
 for(const key of requiredAutomated)if(automated[key]!==true)blockers.push('AUTOMATED_CHECK_REQUIRED:'+key);
 for(const key of requiredPhysical)if(physical[key]!==true)blockers.push('PHYSICAL_CHECK_REQUIRED:'+key);
 const ready=blockers.length===0;
 return Object.freeze({kind:'phase3-exit-gate',version:1,phase:3,phaseName:'Season/calendar engine',ready,
  automatedChecksPassed:requiredAutomated.every(k=>automated[k]===true),
  physicalChecksPassed:requiredPhysical.every(k=>physical[k]===true),
  phase4MayBegin:ready,nextPhase:ready?4:null,nextPhaseName:ready?'Player development engine':null,
  blockers:Object.freeze(blockers),requiredAutomated:Object.freeze(requiredAutomated.slice()),requiredPhysical:Object.freeze(requiredPhysical.slice())});
}
module.exports={evaluatePhase3ExitGate};