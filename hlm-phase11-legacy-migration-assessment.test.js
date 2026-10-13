'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {assess,roundtripFixture}=require('./hlm-phase11-legacy-migration-assessment');
const app=fs.readFileSync('app.html','utf8');
const guide=fs.readFileSync('PHASE11_PRODUCTION_INTEGRATION_READINESS.md','utf8');
for(const p of [/const DBNAME='hlm_front_office_v8'/,/const OLDDB='hlm_front_office_v5'/,/function compactState\(\)/])assert.match(app,p);
assert.match(guide,/falls back to old migration/);
const base={schema:5,settings:{controlledTeamId:42},roster:[{id:1,teamId:42}],contracts:[{playerId:1,capHit:2000000}],draftPicks:[{year:2027,round:1,ownerId:42}],prospects:[{id:2,potential:'Elite'}],history:[{year:2026,wins:40}],extraDraftPicks:[],transactions:[{type:'trade'}]};
const before=JSON.stringify(base);assert.equal(assess(base).compatible,true);assert.deepEqual(roundtripFixture(base),base);assert.equal(JSON.stringify(base),before);
for(const field of ['roster','contracts','draftPicks','prospects','history']){const x=structuredClone(base);delete x[field];const result=assess(x);assert.equal(result.compatible,true);assert(result.warnings.some(w=>w.includes(field)))}
const duplicate=structuredClone(base);duplicate.prospects.push({id:1});assert.equal(assess(duplicate).compatible,false);assert(assess(duplicate).errors.some(e=>e.includes('Duplicate')));
const mismatch=structuredClone(base);mismatch.roster[0].teamId=99;assert(assess(mismatch).warnings.some(w=>w.includes('Other-team')));
const owner=structuredClone(base);delete owner.draftPicks[0].ownerId;assert.equal(assess(owner).compatible,false);
const noTeam=structuredClone(base);delete noTeam.settings.controlledTeamId;assert.equal(assess(noTeam).compatible,false);
for(const schema of [4,6,8,999,'5'])assert.equal(assess({...base,schema}).compatible,false);
assert.equal(assess({...base,schema:7}).compatible,true);
assert.equal(assess(null).compatible,false);
console.log('Isolated synthetic legacy migration assessment passed; no production migration executed');
