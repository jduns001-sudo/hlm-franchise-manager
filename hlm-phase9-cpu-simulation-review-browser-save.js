'use strict';
// Persist a verified date-only simulation candidate and its leaguewide CPU advisory review to a separate browser slot.
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {reviewCPUOrganizationsAfterSimulation}=require('./hlm-phase9-cpu-simulation-cycle-review');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function persistReviewedCPUSimulationCandidate({storage,sourceSlotId,destinationSlotId,sourceState,simulationVerification,
 decisionOptionsByTeam={},confirmCommit=false}={}){
 if(confirmCommit!==true)fail('CPU_SIMULATION_SAVE_APPROVAL_REQUIRED','Human GM must approve isolated simulation save');
 const repository=createBrowserSaveAdapter(storage);
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||!repository.has(sourceSlotId.trim()))
  fail('CPU_SIMULATION_SAVE_SOURCE_REQUIRED','Existing source save required');
 if(typeof destinationSlotId!=='string'||!destinationSlotId.trim()||destinationSlotId.trim()===sourceSlotId.trim()||
    repository.has(destinationSlotId.trim()))
  fail('CPU_SIMULATION_SAVE_DESTINATION_UNAVAILABLE','Separate empty destination save slot required');
 const sourceFingerprint=serializeGameState(repository.load(sourceSlotId.trim()).state);
 if(sourceFingerprint!==serializeGameState(sourceState))
  fail('CPU_SIMULATION_SAVE_SOURCE_STALE','Simulation source differs from persisted franchise');
 const review=reviewCPUOrganizationsAfterSimulation({sourceState,simulationVerification,decisionOptionsByTeam});
 if(review.sourceFingerprint!==sourceFingerprint)
  fail('CPU_SIMULATION_SAVE_REVIEW_STALE','Review source fingerprint mismatch');
 const candidate=simulationVerification.state;
 if(serializeGameState(repository.load(sourceSlotId.trim()).state)!==sourceFingerprint)
  fail('CPU_SIMULATION_SAVE_SOURCE_CHANGED','Source changed during review');
 repository.save(destinationSlotId.trim(),candidate,{label:'Phase 9 reviewed CPU simulation candidate'});
 try{
  if(serializeGameState(repository.load(destinationSlotId.trim()).state)!==review.candidateFingerprint||
     serializeGameState(repository.load(sourceSlotId.trim()).state)!==sourceFingerprint)
   fail('CPU_SIMULATION_SAVE_VERIFY_FAILED','Saved candidate or original source failed verification');
 }catch(error){
  // Retain destination as recovery evidence if write succeeded but reload failed.
  fail('CPU_SIMULATION_SAVE_VERIFY_FAILED','Browser save verification failed; inspect destination slot before retrying');
 }
 return Object.freeze({kind:'phase9-reviewed-cpu-simulation-browser-save',version:1,
  sourceSlotId:sourceSlotId.trim(),destinationSlotId:destinationSlotId.trim(),
  fromDate:review.fromDate,toDate:review.toDate,teamCount:review.teamCount,
  leagueReview:review.leagueReview,verified:true,sourcePreserved:true,
  activeFranchiseSlotReplaced:false,eventsProcessed:false,gamesSimulated:false,cpuActionsExecuted:false});
}
module.exports={persistReviewedCPUSimulationCandidate};
