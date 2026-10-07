'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function createFranchiseActionTransaction(state,action){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_FRANCHISE_ACTION_STATE','Valid GameState required.');
 if(!action||action.candidateOnly!==true||action.sourceStateMutated!==false||action.persistencePerformed!==false)fail('INVALID_FRANCHISE_ACTION_CANDIDATE','Read-only franchise action candidate required.');
 return Object.freeze({kind:'franchise-action-transaction',version:1,sourceState:state,candidateState:clone(state),action,transactionPerformed:false,persistencePerformed:false});
}
function verifyFranchiseActionTransaction(tx){
 if(!tx||tx.kind!=='franchise-action-transaction'||tx.version!==1)fail('INVALID_FRANCHISE_ACTION_TRANSACTION','Transaction required.');
 const valid=validateGameStateEnvelope(tx.candidateState).valid&&JSON.stringify(tx.sourceState)===JSON.stringify(tx.candidateState)&&tx.transactionPerformed===false&&tx.persistencePerformed===false;
 if(!valid)fail('FRANCHISE_ACTION_TRANSACTION_VERIFICATION_FAILED','Candidate state must exactly match source before execution is implemented.');
 return Object.freeze({kind:'franchise-action-transaction-verification',version:1,verified:true,transaction:tx,sourceState:tx.sourceState,candidateState:tx.candidateState,action:tx.action});
}
function authorizeFranchiseAction(verification,approval){
 if(!verification||verification.kind!=='franchise-action-transaction-verification'||verification.verified!==true)fail('INVALID_FRANCHISE_ACTION_VERIFICATION','Verified transaction required.');
 const approved=approval===true;
 return Object.freeze({kind:'franchise-action-authorization',version:1,approved,verification,action:verification.action,executionPerformed:false,persistencePerformed:false,humanGMFinalDecision:true});
}
module.exports={createFranchiseActionTransaction,verifyFranchiseActionTransaction,authorizeFranchiseAction};
