'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-prospect-evaluations');
const state=createGameStateEnvelope({prospects:[{id:'p1'}]});const before=JSON.stringify(state);
const i=x.createProspectInterview(state,{prospectId:'p1',personalityInformation:{note:'caller'}});assert.strictEqual(i.personalityTruthExposed,false);
const c=x.createCombineEvaluation(state,{prospectId:'p1',athleticMeasurements:{speed:'caller'}});assert.strictEqual(c.hockeyEvaluationReplaced,false);
const m=x.createMedicalEvaluation(state,{prospectId:'p1',injuryHistory:['caller'],durabilityInformation:'caller',medicalConcerns:['caller']});assert.strictEqual(m.medicalRiskCalculated,false);
const b=x.createProspectEvaluationBundle(state,{prospectId:'p1',interviews:[i],combine:[c],medical:[m]});assert.strictEqual(b.scoutingCertaintyGuaranteed,false);assert.strictEqual(b.automaticDraftRankChange,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Prospect interview/combine/medical tests passed.');
