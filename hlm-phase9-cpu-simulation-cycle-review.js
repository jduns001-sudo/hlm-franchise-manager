'use strict';
// Bind leaguewide CPU advisory review to a verified, approved simulation GameState activation.
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createLeaguewideCPUDecisionReview}=require('./hlm-phase9-leaguewide-cpu-decision-review');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function reviewCPUOrganizationsAfterSimulation({sourceState,simulationVerification,decisionOptionsByTeam={}}={}){
 if(!simulationVerification||simulationVerification.kind!=='simulation-command-gamestate-activation-verification'||
    simulationVerification.verified!==true||simulationVerification.activation?.authorization?.approved!==true||
    simulationVerification.activation?.authorization?.verification!==simulationVerification.activation?.verification||
    simulationVerification.state!==simulationVerification.activation?.state||
    simulationVerification.eventsUnprocessed!==true||simulationVerification.gameSimulationPerformed!==false||
    simulationVerification.universeSystemsProcessed!==false||simulationVerification.persistencePerformed!==false)
  fail('CPU_SIMULATION_REVIEW_UNVERIFIED','Verified approved date-only simulation activation required');
 if(!sourceState||simulationVerification.activation.verification?.sourceState!==sourceState)
  fail('CPU_SIMULATION_REVIEW_SOURCE_MISMATCH','Exact source GameState lineage required');
 const before=serializeGameState(sourceState),candidateBefore=serializeGameState(simulationVerification.state);
 if(sourceState.meta.currentDate!==simulationVerification.fromDate||
    simulationVerification.state.meta.currentDate!==simulationVerification.toDate)
  fail('CPU_SIMULATION_REVIEW_DATE_MISMATCH','Simulation date lineage mismatch');
 const leagueReview=createLeaguewideCPUDecisionReview(simulationVerification.state,{decisionOptionsByTeam});
 if(serializeGameState(sourceState)!==before||serializeGameState(simulationVerification.state)!==candidateBefore)
  fail('CPU_SIMULATION_REVIEW_MUTATION','Review must preserve both GameStates');
 return Object.freeze({kind:'phase9-cpu-simulation-cycle-review',version:1,
  fromDate:simulationVerification.fromDate,toDate:simulationVerification.toDate,
  mode:simulationVerification.mode,teamCount:leagueReview.teamCount,
  sourceFingerprint:before,candidateFingerprint:candidateBefore,leagueReview,
  advisoryOnly:true,requiresHumanGMApproval:true,simulationApproved:true,
  cpuActionsExecuted:false,eventsProcessed:false,gamesSimulated:false,persistencePerformed:false,
  sourcePreserved:true,candidatePreserved:true});
}
module.exports={reviewCPUOrganizationsAfterSimulation};
