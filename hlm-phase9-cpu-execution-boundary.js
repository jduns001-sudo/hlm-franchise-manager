'use strict';
// Explicit fail-closed boundary: CPU advisory authorization is not transaction execution.
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {verifyCPUActionExecutionPackage}=require('./hlm-cpu-action-execution-verification');
const {createTradeExecutionPackage}=require('./hlm-trade-execution-gate');
function inspectCPUExecutionBoundary(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)throw new TypeError('Valid GameState required');
 const before=JSON.stringify(state);
 const cpu=verifyCPUActionExecutionPackage(state,teamId,options.decision||{});
 const controlled=String(state.meta?.controlledTeamId??'');
 const humanControlled=controlled!==''&&String(teamId)===controlled;
 const trade=options.trade===undefined?null:createTradeExecutionPackage(state,options.trade);
 const blockers=[];
 if(humanControlled)blockers.push('human-controlled-team-protected');
 if(!cpu.verification.verified)blockers.push('cpu-advisory-preflight-not-verified');
 if(cpu.checks.executorDisabled)blockers.push('cpu-executor-not-implemented');
 if(trade&&!trade.authorization.authorized)blockers.push('trade-execution-not-authorized');
 if(trade)blockers.push('trade-candidate-not-executed');
 if(JSON.stringify(state)!==before)throw new Error('CPU boundary inspection mutated source state');
 return Object.freeze({kind:'phase9-cpu-execution-boundary',version:1,teamId:String(teamId),humanControlled,
  cpuVerified:cpu.verification.verified,tradeCandidateVerified:trade?.verification.verified??null,
  canExecute:false,executionPerformed:false,persistencePerformed:false,sourceStateMutated:false,
  blockers:Object.freeze(blockers)});
}
module.exports={inspectCPUExecutionBoundary};
