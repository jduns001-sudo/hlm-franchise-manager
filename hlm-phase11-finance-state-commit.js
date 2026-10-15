'use strict';
/* Explicit isolated GameState finance persistence, no automatic Front Office wiring. */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {derive,previewDay}=require('./hlm-phase11-gamestate-finance');
function assertState(state){if(!validateGameStateEnvelope(state).valid)throw Error('Invalid GameState')}
function clone(state){return JSON.parse(JSON.stringify(state))}
function writeFinanceSnapshot(state,teamId,policy,{confirmed=false}={}){
 if(confirmed!==true)throw Error('Explicit finance snapshot confirmation required');
 assertState(state);
 const calculated=derive(state,teamId,policy);
 const next=clone(state),id=String(teamId);
 if(!next.finances.teamSnapshots||typeof next.finances.teamSnapshots!=='object'||Array.isArray(next.finances.teamSnapshots))next.finances.teamSnapshots={};
 next.finances.teamSnapshots[id]={teamId:calculated.teamId,teamName:calculated.teamName,calendar:calculated.calendar,financials:calculated.financials,cpu:calculated.cpu,policy:calculated.policy};
 assertState(next);
 return next;
}
function advanceWithFinances(state,seed,teamIds,policies,{confirmed=false}={}){
 if(confirmed!==true)throw Error('Explicit finance simulation confirmation required');
 assertState(state);if(!Array.isArray(teamIds)||!teamIds.length)throw Error('Team ids required');
 const unique=new Set(teamIds.map(String));if(unique.size!==teamIds.length)throw Error('Duplicate team id');
 const simulation=previewDay(state,seed,teamIds[0],policies[String(teamIds[0])]);
 let next=simulation.nextState;
 for(const id of teamIds){const policy=policies[String(id)];if(!policy)throw Error('Missing financial policy for team '+id);next=writeFinanceSnapshot(next,id,policy,{confirmed:true})}
 return {nextState:next,results:simulation.gameResults,fromDate:simulation.fromDate,toDate:simulation.toDate};
}
module.exports={writeFinanceSnapshot,advanceWithFinances};
