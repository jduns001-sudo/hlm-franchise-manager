'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {ASSESSMENT_FACTORS,createCPUOrganizationalAssessment}=require('./hlm-cpu-organizational-assessment');
const state=createGameStateEnvelope({teams:[{id:'PIT',name:'Pittsburgh'}],players:[],contracts:[],draftPicks:[{pickId:'p1',currentOwnerId:'PIT'}],injuries:[]});const before=JSON.stringify(state);
const a=createCPUOrganizationalAssessment(state,'PIT',{profile:{competitiveState:'Emerging',leadership:{philosophy:'Youth'}},context:{teamNeeds:[{area:'center'}],competitiveWindow:[{window:'future'}],chemistry:[{status:'unknown'}]}});
assert.strictEqual(a.kind,'cpu-organizational-assessment');assert.strictEqual(a.teamId,'PIT');assert.strictEqual(a.competitive.state,'Emerging');assert.strictEqual(a.competitive.valid,true);assert.strictEqual(a.identity.philosophy,'Youth');assert.strictEqual(a.facts.draftPickCount,1);assert.strictEqual(a.context.teamNeeds[0].area,'center');assert.ok(ASSESSMENT_FACTORS.includes('ownerGoals'));assert.ok(ASSESSMENT_FACTORS.includes('playerValue'));assert.strictEqual(a.decisionStage.stage,'assess');assert.strictEqual(a.decisionStage.identifyProblemsPerformed,false);assert.strictEqual(a.authority.cpuDecisionExecutionEnabled,false);assert.strictEqual(a.sourceStateMutated,false);assert.strictEqual(a.persistencePerformed,false);assert.strictEqual(JSON.stringify(state),before);
assert.throws(()=>createCPUOrganizationalAssessment(state,'MISSING'),/Team not found/);
console.log('Phase 9 CPU organizational assessment tests passed.');
