'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createRosterOperationCandidate}=require('./hlm-roster-operations-candidates');const {createFranchiseActionTransaction,verifyFranchiseActionTransaction,authorizeFranchiseAction}=require('./hlm-franchise-action-transaction');
const state=createGameStateEnvelope({teams:[{id:'PIT'}],players:[{id:1,teamId:'PIT'}]});const before=JSON.stringify(state);
const action=createRosterOperationCandidate(state,{type:'call-up',playerId:1,teamId:'PIT',assignmentType:'standard',leagueRules:{approved:true}});
const tx=createFranchiseActionTransaction(state,action);assert.notStrictEqual(tx.candidateState,state);assert.strictEqual(JSON.stringify(tx.candidateState),before);
const verified=verifyFranchiseActionTransaction(tx);assert.strictEqual(verified.verified,true);
const denied=authorizeFranchiseAction(verified,false);assert.strictEqual(denied.approved,false);assert.strictEqual(denied.executionPerformed,false);
const approved=authorizeFranchiseAction(verified,true);assert.strictEqual(approved.approved,true);assert.strictEqual(approved.humanGMFinalDecision,true);assert.strictEqual(approved.executionPerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Franchise action transaction tests passed.');
