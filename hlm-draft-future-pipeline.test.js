'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-draft-future-pipeline');
const state=createGameStateEnvelope({prospects:[{id:'p1'}]});const before=JSON.stringify(state);
for(const type of x.SURPRISE_TYPES)assert.strictEqual(x.createDraftSurprise(state,{prospectId:'p1',type}).generated,false);
const r=x.createDraftRetrospective(state,{prospectId:'p1',careerOutcome:'caller'});assert.strictEqual(r.automaticGrade,false);assert.strictEqual(r.evaluation,null);
const p=x.createFutureProspectPipeline(state,{draftYear:2030,prospectIds:['p1']});assert.strictEqual(p.developmentBeforeEligibility,true);assert.strictEqual(p.scoutingInformationMayEvolve,true);assert.strictEqual(p.generationPerformed,false);
for(const type of x.STORY_TYPES)assert.strictEqual(x.createProspectStory(state,{prospectId:'p1',type}).trajectoryCalculated,false);
assert.strictEqual(JSON.stringify(state),before);console.log('Draft future pipeline tests passed.');
