'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createGameStateCalendarAdvancementCandidate}=require('./hlm-gamestate-calendar-advancement-candidate');
const {verifyGameStateCalendarAdvancementCandidate}=require('./hlm-gamestate-calendar-candidate-verification');
function err(code,m){const e=new Error(m);e.code=code;return e;}
function assertCommandVerification(v){
 if(!v||v.kind!=='simulation-command-calendar-verification'||v.version!==1||v.verified!==true||!v.calendarVerification||
 v.calendarVerification.kind!=='calendar-advancement-verification'||v.calendarVerification.verified!==true||
 v.eventsUnprocessed!==true||v.gameSimulationPerformed!==false||v.universeSystemsProcessed!==false||v.persistencePerformed!==false)
 throw err('INVALID_SIMULATION_GAMESTATE_INTEGRATION','Verified simulation command calendar execution required.');return v;
}
function createSimulationGameStateCandidate({state,verification}={}){
 assertCommandVerification(verification);if(!validateGameStateEnvelope(state).valid||state.meta.currentDate!==verification.fromDate)throw err('INVALID_SIMULATION_GAMESTATE_INTEGRATION','Source GameState must match command source date.');
 const calendarCandidate=createGameStateCalendarAdvancementCandidate({state,verification:verification.calendarVerification});
 return Object.freeze({kind:'simulation-command-gamestate-candidate',version:1,mode:verification.mode,days:verification.days,fromDate:verification.fromDate,toDate:verification.toDate,
 verification,sourceState:state,calendarCandidate,state:calendarCandidate.state,eventsProcessed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
}
function verifySimulationGameStateCandidate({sourceState,candidate}={}){
 if(!candidate||candidate.kind!=='simulation-command-gamestate-candidate'||candidate.version!==1||candidate.sourceState!==sourceState||
 candidate.eventsProcessed||candidate.gameSimulationPerformed||candidate.universeSystemsProcessed||candidate.persistencePerformed)throw err('SIMULATION_GAMESTATE_CANDIDATE_VERIFICATION_FAILED','Valid unified GameState candidate required.');
 assertCommandVerification(candidate.verification);let base;try{base=verifyGameStateCalendarAdvancementCandidate({sourceState,candidate:candidate.calendarCandidate});}catch(_){throw err('SIMULATION_GAMESTATE_CANDIDATE_VERIFICATION_FAILED','Date-only GameState verification failed.');}
 if(base.candidate!==candidate.calendarCandidate||candidate.state!==candidate.calendarCandidate.state||candidate.state.meta.currentDate!==candidate.toDate)throw err('SIMULATION_GAMESTATE_CANDIDATE_VERIFICATION_FAILED','Candidate lineage mismatch.');
 return Object.freeze({kind:'simulation-command-gamestate-candidate-verification',version:1,verified:true,dateOnlyChangeVerified:true,sourceStatePreserved:true,
 mode:candidate.mode,days:candidate.days,fromDate:candidate.fromDate,toDate:candidate.toDate,sourceState,candidate,state:candidate.state,calendarCandidateVerification:base,
 eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
}
function authorizeSimulationGameStateActivation({verification,approved}={}){
 if(!verification||verification.kind!=='simulation-command-gamestate-candidate-verification'||verification.verified!==true)throw err('SIMULATION_GAMESTATE_ACTIVATION_NOT_AUTHORIZED','Verified candidate required.');
 if(approved!==true)throw err('SIMULATION_GAMESTATE_ACTIVATION_NOT_AUTHORIZED','Explicit activation approval required.');
 return Object.freeze({kind:'simulation-command-gamestate-activation-authorization',version:1,approved:true,verification,mode:verification.mode,days:verification.days,fromDate:verification.fromDate,toDate:verification.toDate});
}
function activateSimulationGameState({verification,authorization}={}){
 if(!authorization||authorization.kind!=='simulation-command-gamestate-activation-authorization'||!authorization.approved||authorization.verification!==verification||
 verification?.kind!=='simulation-command-gamestate-candidate-verification'||!verification.verified)throw err('SIMULATION_GAMESTATE_ACTIVATION_FAILED','Exact activation authorization required.');
 return Object.freeze({kind:'isolated-simulation-command-gamestate-activation',version:1,activated:true,mode:verification.mode,days:verification.days,fromDate:verification.fromDate,toDate:verification.toDate,
 verification,authorization,state:verification.state,eventsProcessed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
}
function verifySimulationGameStateActivation({activation}={}){
 if(!activation||activation.kind!=='isolated-simulation-command-gamestate-activation'||!activation.activated||activation.authorization?.verification!==activation.verification||
 activation.state!==activation.verification?.state||!validateGameStateEnvelope(activation.state).valid||activation.state.meta.currentDate!==activation.toDate||
 activation.eventsProcessed||activation.gameSimulationPerformed||activation.universeSystemsProcessed||activation.persistencePerformed)throw err('SIMULATION_GAMESTATE_ACTIVATION_VERIFICATION_FAILED','Activated state does not preserve exact verified lineage.');
 return Object.freeze({kind:'simulation-command-gamestate-activation-verification',version:1,verified:true,candidateIdentityPreserved:true,authorizationLineageVerified:true,
 mode:activation.mode,days:activation.days,fromDate:activation.fromDate,toDate:activation.toDate,activation,state:activation.state,
 eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
}
module.exports={createSimulationGameStateCandidate,verifySimulationGameStateCandidate,authorizeSimulationGameStateActivation,activateSimulationGameState,verifySimulationGameStateActivation};