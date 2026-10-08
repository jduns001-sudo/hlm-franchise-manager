'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createCPUActionExecutionPreflight}=require('./hlm-cpu-action-execution-preflight');

const state=createGameStateEnvelope({teams:[{id:'PIT',name:'Pittsburgh'}],players:[],contracts:[],draftPicks:[]});
const before=JSON.stringify(state);
const prioritization={evaluation:{identification:{problems:[{id:'cap-pressure',category:'cap',severity:'high'}]},options:[{id:'trade-option',problemId:'cap-pressure',type:'trades'}]},priorities:[{id:'first',optionId:'trade-option',tier:'high',order:1}]};

const blocked=createCPUActionExecutionPreflight(state,'PIT',{prioritization,priorityId:'first',authorized:true});
assert.strictEqual(blocked.preflight.passed,false);

const passed=createCPUActionExecutionPreflight(state,'PIT',{prioritization,priorityId:'first',authorized:true,execute:true});
assert.strictEqual(passed.kind,'cpu-action-execution-preflight-package');
assert.strictEqual(passed.preflight.passed,true);
assert.strictEqual(passed.preflight.requestAccepted,true);
assert.strictEqual(passed.preflight.executionReady,true);
assert.strictEqual(passed.preflight.humanAuthorized,true);
assert.strictEqual(passed.preflight.transactionVerified,true);
assert.strictEqual(passed.preflight.executorEnabled,false);
assert.strictEqual(passed.preflight.executionPerformed,false);
assert.strictEqual(passed.authority.cpuDecisionExecutionEnabled,false);
assert.strictEqual(passed.decisionStage.actExecutionPreflightPassed,true);
assert.strictEqual(passed.decisionStage.actPerformed,false);
assert.strictEqual(passed.persistencePerformed,false);
assert.strictEqual(JSON.stringify(state),before);

const invalid=createCPUActionExecutionPreflight(state,'PIT',{prioritization,priorityId:'missing',authorized:true,execute:true});
assert.strictEqual(invalid.preflight.passed,false);
assert.throws(()=>createCPUActionExecutionPreflight(state,'MISSING',{authorized:true,execute:true}),/Team not found/);
console.log('Phase 9 CPU action execution preflight tests passed.');
