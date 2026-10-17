'use strict';
const assert=require('node:assert/strict');
const {project,read,LEGACY_KEY}=require('./hlm-phase11-frontoffice-readonly-projection');
const data={teams:[{id:1,name:'Owner'},{id:2,name:'CPU'}],players:[{id:11,teamId:1,name:'Forward'},{id:22,teamId:2,name:'Goalie'}],games:[{id:'G1',date:'2026-10-18',status:'scheduled',homeTeamId:1,awayTeamId:2}],gmSettings:{controlledTeamId:1},gameStateMeta:{saveId:'production',currentDate:'2026-10-17'},contracts:[{id:'C1',playerId:11}]};
const raw=JSON.stringify(data),writes=[];
const storage={getItem:key=>key===LEGACY_KEY?raw:null,setItem:(...args)=>writes.push(args)};
const view=read(storage);
assert.equal(view.controlledTeamId,1);
assert.equal(view.players[0].id,11);
assert.equal(view.nextGame.id,'G1');
assert.equal(view.saveId,'production');
assert.equal(view.currentDate,'2026-10-17');
assert.equal(view.readOnly,true);
assert.equal(view.productionActivationAllowed,false);
assert.equal(view.isolatedSimulationAllowed,false);
view.players[0].name='changed';
assert.equal(data.players[0].name,'Forward');
assert.equal(JSON.stringify(data),raw);
assert.deepEqual(writes,[]);
for(const [edit,pattern] of [
 [s=>s.gmSettings.controlledTeamId=99,/Controlled team/],
 [s=>s.players.push({...s.players[0]}),/Duplicate or missing player/],
 [s=>s.teams.push({...s.teams[0]}),/Duplicate or missing team/],
 [s=>s.games.push({...s.games[0]}),/Duplicate or missing game/],
 [s=>s.games[0].awayTeamId=99,/Schedule references/]
]){const x=JSON.parse(raw);edit(x);assert.throws(()=>project(x),pattern);}
assert.deepEqual(project({...data,games:[]}).diagnostics,['NO_GAME_SCHEDULE']);
assert.throws(()=>read({getItem:()=>null}),/No local/);
console.log('Mission 1208 canonical identity, read-only legacy projection and no-write tests passed');
