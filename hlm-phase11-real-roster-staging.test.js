'use strict';
const assert=require('node:assert/strict');
const {stage}=require('./hlm-phase11-real-roster-staging');
const {project}=require('./hlm-phase11-frontoffice-readonly-projection');
const source={teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],players:[{id:10,teamId:1},{id:20,teamId:2}],contracts:[{id:30,playerId:10}],games:[],gmSettings:{controlledTeamId:1},gameStateMeta:{saveId:'original',currentDate:'2026-10-17'}};
const original=JSON.stringify(source),view=project(source);
assert.throws(()=>stage(view,false),/approval/);
const staged=stage(view,true);
assert.equal(staged.meta.controlledTeamId,1);
assert.equal(staged.meta.saveId,'isolated-stage:original');
assert.equal(staged.universe.players[0].id,10);
assert.equal(staged.assets.contracts[0].playerId,10);
assert.deepEqual(staged.activity.games,[]);
assert.equal(staged.extensions.staging.productionActivationAllowed,false);
staged.universe.players[0].teamId=2;
assert.equal(source.players[0].teamId,1);
assert.equal(JSON.stringify(source),original);
for(const change of [
 s=>s.players[0].teamId=999,
 s=>s.contracts[0].playerId=999,
 s=>s.contracts.push({...s.contracts[0]}),
 s=>s.gameStateMeta.currentDate=null,
 s=>s.gameStateMeta.saveId=null
]){const copy=JSON.parse(original);change(copy);assert.throws(()=>stage(project(copy),true));}
console.log('Mission 1209 pure staging identity and isolation regressions passed');
