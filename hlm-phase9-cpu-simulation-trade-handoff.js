'use strict';
// Explicit handoff from an isolated, reviewed simulation save to a CPU trade proposal.
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createBrowserCPUTradeWorkflow}=require('./hlm-phase9-cpu-browser-approved-workflow');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function prepareCPUTradeAfterReviewedSimulation({storage,simulationSaveResult,teamId,steps,decisionOptions}={}){
 if(!simulationSaveResult||simulationSaveResult.kind!=='phase9-reviewed-cpu-simulation-browser-save'||
    simulationSaveResult.verified!==true||simulationSaveResult.sourcePreserved!==true||
    simulationSaveResult.activeFranchiseSlotReplaced!==false||
    simulationSaveResult.cpuActionsExecuted!==false||simulationSaveResult.gamesSimulated!==false)
  fail('CPU_SIMULATION_TRADE_UNVERIFIED','Verified isolated simulation save required');
 const repository=createBrowserSaveAdapter(storage);
 const slot=simulationSaveResult.destinationSlotId;
 if(typeof slot!=='string'||!repository.has(slot))
  fail('CPU_SIMULATION_TRADE_SAVE_MISSING','Reviewed simulation destination must exist');
 const state=repository.load(slot).state;
 if(typeof simulationSaveResult.candidateFingerprint!=='string'||
    serializeGameState(state)!==simulationSaveResult.candidateFingerprint)
  fail('CPU_SIMULATION_TRADE_CANDIDATE_MISMATCH','Reviewed simulation candidate fingerprint mismatch');
 if(typeof simulationSaveResult.sourceFingerprint!=='string'||
    typeof simulationSaveResult.sourceSlotId!=='string'||
    !repository.has(simulationSaveResult.sourceSlotId)||
    serializeGameState(repository.load(simulationSaveResult.sourceSlotId).state)!==simulationSaveResult.sourceFingerprint)
  fail('CPU_SIMULATION_TRADE_SOURCE_MISMATCH','Original simulation source fingerprint mismatch');
 if(simulationSaveResult.sourceSlotId===slot)
  fail('CPU_SIMULATION_TRADE_SOURCE_MISMATCH','Source and candidate slots must be distinct');
 if(state.meta.currentDate!==simulationSaveResult.toDate)
  fail('CPU_SIMULATION_TRADE_DATE_MISMATCH','Reviewed simulation save date mismatch');
 const controlled=String(state.meta.controlledTeamId??'');
 if(!controlled||String(teamId)===controlled)
  fail('CPU_SIMULATION_TRADE_HUMAN_PROTECTED','Human GM team cannot execute CPU trades');
 if(!simulationSaveResult.leagueReview?.items?.some(item=>item.teamId===String(teamId)&&item.executionEnabled===false))
  fail('CPU_SIMULATION_TRADE_TEAM_NOT_REVIEWED','Selected CPU organization must be present in simulation review');
 const sourceFingerprint=serializeGameState(state);
 const workflow=createBrowserCPUTradeWorkflow({storage,sourceSlotId:slot,teamId,steps,decisionOptions});
 if(workflow.preview.sourceFingerprint!==sourceFingerprint)
  fail('CPU_SIMULATION_TRADE_SOURCE_CHANGED','CPU trade source changed during handoff');
 return Object.freeze({kind:'phase9-cpu-simulation-trade-handoff',version:1,
  sourceSlotId:slot,teamId:String(teamId),simulationDate:state.meta.currentDate,
  sourceFingerprint,workflow,reviewedPreview:workflow.preview,
  requiresHumanGMApproval:true,autonomousExecutionEnabled:false,executed:false});
}
module.exports={prepareCPUTradeAfterReviewedSimulation};
