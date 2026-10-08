'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createCPUActionExecutionReadiness}=require('./hlm-cpu-action-execution-readiness');

const state=createGameStateEnvelope({teams:[{id:'PIT',name:'Pittsburgh'}],players:[],contracts:[],draftPicks:[]});
const before=JSON.stringify(state);
const prioritization={evaluation:{identification:{problems:[{id:'cap-pressure',category:'cap',severity:'high'}]},options:[{id:'trade-option',problemId:'cap-pressure',type:'trades'}]},priorities:[{id:'first',optionId:'trade-option',tier:'high',order:1}]};

const blocked=createCPUActionExecutionReadiness(state,'PIT',{prioritization,priorityId:'first'});
assert.strictEqual(blocked.readiness.ready,false);
assert.strictEqual(blocked.readiness.executionPerformed,false);

const ready=createCPUActionExecutionReadiness(state,'PIT',{prioritization,priorityId:'first',authorized:true});
assert.strictEqual(ready.kind,'cpu-action-execution-readiness-package');
assert.strictEqual(ready.readiness.ready,true);
assert.strictEqual(ready.readiness.humanAuthorized,true);
assert.strictEqual(ready.readiness.transactionVerified,true);
assert.strictEqual(ready.readiness.executionRequested,false);
assert.strictEqual(ready.readiness.executionPerformed,false);
assert.strictEqual(ready.authority.cpuDecisionExecutionEnabled,false);
assert.strictEqual(ready.decisionStage.actExecutionReady,true);
assert.strictEqual(ready.decisionStage.actPerformed,false);
assert.strictEqual(ready.persistencePerformed,false);
assert.strictEqual(JSON.stringify(state),before);

const invalid=createCPUActionExecutionReadiness(state,'PIT',{prioritization,priorityId:'missing',authorized:true});
assert.strictEqual(invalid.readiness.ready,false);
assert.throws(()=>createCPUActionExecutionReadiness(state,'MISSING',{authorized:true}),/Team not found/);
console.log('Phase 9 CPU action execution readiness tests passed.');
