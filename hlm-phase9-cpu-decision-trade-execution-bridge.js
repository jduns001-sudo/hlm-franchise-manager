'use strict';
// Bridge advisory CPU decision verification to a separate, reviewed trade execution.
// A generic advisory action is not a trade authorization: both gates are required.
const {serializeGameState}=require('./hlm-game-state-serialization');
const {verifyCPUActionExecutionPackage}=require('./hlm-cpu-action-execution-verification');
const {executeApprovedCPUTradeBatch}=require('./hlm-phase9-cpu-approved-trade-persistent-executor');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function executeReviewedCPUDecisionTrade({repository,sourceSlotId,destinationSlotId,teamId,decisionOptions,steps,reviewedPreview,confirmExecution=false}={}){
 if(confirmExecution!==true)fail('CPU_DECISION_TRADE_APPROVAL_REQUIRED','Human GM execution approval required');
 if(!repository||typeof repository.load!=='function')fail('CPU_DECISION_TRADE_REPOSITORY_REQUIRED','Readable save repository required');
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim())fail('CPU_DECISION_TRADE_SOURCE_REQUIRED','Source slot required');
 const source=repository.load(sourceSlotId).state;
 const before=serializeGameState(source);
 if(String(teamId)===String(source.meta.controlledTeamId))
  fail('CPU_DECISION_TRADE_HUMAN_PROTECTED','Human controlled team cannot execute CPU decisions');
 if(!Array.isArray(steps)||!steps.length||steps.some(s=>String(s.teamId)!==String(teamId)))
  fail('CPU_DECISION_TRADE_TEAM_MISMATCH','All approved trade steps must originate from selected CPU organization');
 const advisory=verifyCPUActionExecutionPackage(source,teamId,decisionOptions||{});
 if(advisory.preflightPackage?.requestPackage?.readinessPackage?.authorizationPackage?.candidate?.action?.type!=='trades')
  fail('CPU_DECISION_TRADE_ACTION_MISMATCH','Authorized CPU action must be a trade');
 if(advisory.verification.verified!==true||advisory.checks.humanAuthorized!==true)
  fail('CPU_DECISION_TRADE_PREFLIGHT_FAILED','CPU decision must pass human-authorized advisory preflight');
 if(before!==serializeGameState(source))
  fail('CPU_DECISION_TRADE_SOURCE_MUTATED','CPU advisory preflight mutated source state');
 const result=executeApprovedCPUTradeBatch({repository,sourceSlotId,destinationSlotId,steps,reviewedPreview,confirmExecution:true});
 if(serializeGameState(repository.load(sourceSlotId).state)!==before)
  fail('CPU_DECISION_TRADE_SOURCE_CHANGED','Source save changed during execution');
 return Object.freeze({kind:'phase9-cpu-decision-trade-execution-bridge',version:1,
  teamId:String(teamId),sourceSlotId,destinationSlotId,decisionPreflightVerified:true,
  reviewedTradeExecuted:result.executed,persisted:result.persisted,verified:result.verified,
  sourcePreserved:true,activeFranchiseSlotReplaced:false,autonomousExecutionEnabled:false});
}
module.exports={executeReviewedCPUDecisionTrade};
