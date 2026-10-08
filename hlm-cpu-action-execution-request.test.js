'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createCPUActionExecutionRequest}=require('./hlm-cpu-action-execution-request');

const state=createGameStateEnvelope({teams:[{id:'PIT',name:'Pittsburgh'}],players:[],contracts:[],draftPicks:[]});
const before=JSON.stringify(state);
const prioritization={evaluation:{identification:{problems:[{id:'cap-pressure',category:'cap',severity:'high'}]},options:[{id:'trade-option',problemId:'cap-pressure',type:'trades'}]},priorities:[{id:'first',optionId:'trade-option',tier:'high',order:1}]};

const noRequest=createCPUActionExecutionRequest(state,'PIT',{prioritization,priorityId:'first',authorized:true});
assert.strictEqual(noRequest.validation.valid,false);
assert.strictEqual(noRequest.request.requested,false);

const blocked=createCPUActionExecutionRequest(state,'PIT',{prioritization,priorityId:'first',execute:true});
assert.strictEqual(blocked.validation.valid,false);
assert.strictEqual(blocked.request.accepted,false);

const accepted=createCPUActionExecutionRequest(state,'PIT',{prioritization,priorityId:'first',authorized:true,execute:true});
assert.strictEqual(accepted.kind,'cpu-action-execution-request-package');
assert.strictEqual(accepted.validation.valid,true);
assert.strictEqual(accepted.request.accepted,true);
assert.strictEqual(accepted.validation.humanAuthorized,true);
assert.strictEqual(accepted.validation.transactionVerified,true);
assert.strictEqual(accepted.request.executionPerformed,false);
assert.strictEqual(accepted.authority.cpuDecisionExecutionEnabled,false);
assert.strictEqual(accepted.decisionStage.actExecutionRequested,true);
assert.strictEqual(accepted.decisionStage.actPerformed,false);
assert.strictEqual(accepted.persistencePerformed,false);
assert.strictEqual(JSON.stringify(state),before);

const invalid=createCPUActionExecutionRequest(state,'PIT',{prioritization,priorityId:'missing',authorized:true,execute:true});
assert.strictEqual(invalid.validation.valid,false);
assert.throws(()=>createCPUActionExecutionRequest(state,'MISSING',{authorized:true,execute:true}),/Team not found/);
console.log('Phase 9 CPU action execution request tests passed.');
