'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-scouting-assignments');
const state=createGameStateEnvelope({});const before=JSON.stringify(state);for(const type of x.ASSIGNMENT_TYPES){const a=x.createScoutingAssignment(state,{scoutId:'s1',teamId:'t1',type,target:'caller'});assert.strictEqual(a.assignmentPerformed,false);}
const r=x.createScoutingResources(state,{teamId:'t1',staff:['s1'],coverage:{region:'caller'}});assert.strictEqual(r.resourceFormulaApplied,false);
const e=x.createProspectExposureContext(state,{competitionLevel:'caller',availableScoutingData:'caller',international:true});assert.strictEqual(e.informationQualityCalculated,false);assert.strictEqual(e.informationQuality,null);
const i=x.createInternationalScoutingReadiness(state,{teamId:'t1',regions:['caller'],leagues:['caller']});assert.strictEqual(i.internationalProspectsSupported,true);assert.strictEqual(i.scoutingPerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Scouting assignment/resource/exposure tests passed.');
