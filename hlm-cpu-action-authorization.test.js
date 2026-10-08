'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {authorizeCPUActionCandidate}=require('./hlm-cpu-action-authorization');

const state=createGameStateEnvelope({teams:[{id:'PIT',name:'Pittsburgh'}],players:[],contracts:[],draftPicks:[]});
const before=JSON.stringify(state);
const prioritization={evaluation:{identification:{problems:[{id:'cap-pressure',category:'cap',severity:'high'}]},options:[{id:'trade-option',problemId:'cap-pressure',type:'trades'}]},priorities:[{id:'first',optionId:'trade-option',tier:'high',order:1}]};

const denied=authorizeCPUActionCandidate(state,'PIT',{prioritization,priorityId:'first'});
assert.strictEqual(denied.validation.valid,false);
assert.strictEqual(denied.authorization.authorized,false);
assert.strictEqual(denied.decisionStage.actPerformed,false);

const approved=authorizeCPUActionCandidate(state,'PIT',{prioritization,priorityId:'first',authorized:true});
assert.strictEqual(approved.kind,'cpu-action-authorization-package');
assert.strictEqual(approved.validation.valid,true);
assert.strictEqual(approved.authorization.authorized,true);
assert.strictEqual(approved.authorization.humanAuthorizationProvided,true);
assert.strictEqual(approved.authorization.executionEnabled,false);
assert.strictEqual(approved.authority.cpuDecisionExecutionEnabled,false);
assert.strictEqual(approved.decisionStage.actAuthorized,true);
assert.strictEqual(approved.decisionStage.actPerformed,false);
assert.strictEqual(approved.persistencePerformed,false);
assert.strictEqual(JSON.stringify(state),before);

const missing=authorizeCPUActionCandidate(state,'PIT',{prioritization,priorityId:'missing',authorized:true});
assert.strictEqual(missing.validation.valid,false);
assert.strictEqual(missing.authorization.authorized,false);
assert.throws(()=>authorizeCPUActionCandidate(state,'MISSING',{authorized:true}),/Team not found/);
console.log('Phase 9 CPU action authorization tests passed.');
