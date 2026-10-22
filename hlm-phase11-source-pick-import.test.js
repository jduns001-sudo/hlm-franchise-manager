'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const importer=require('./hlm-phase11-new-franchise');
const engine=require('./hlm-game-state');
const teams=[{id:1,name:'New Jersey',abbr:'NJD'},{id:5,name:'Pittsburgh',abbr:'PIT'}];
const players=[{id:101,first:'Example',last:'Skater',teamId:1,retired:false,status:1}];
const pick=(year,originalTeamId,teamId,round=1)=>({league:0,year,originalTeamId,teamId,round});
test('only unique, source-backed future picks with eligible owners are imported',()=>{
 const universe={teams,players,draftPicks:[pick(2028,1,5),pick(2029,1,5),pick(2029,1,5),pick(2028,27,5),pick(2024,1,5),pick(2055,1,5)]};
 const result=importer.importSourcePicks(universe,teams);
 assert.equal(result.accepted.length,1);
 assert.equal(result.excludedCount,5);
 assert.deepEqual(result.accepted[0],{pickId:'DP-0-2028-1-1-1',league:0,year:2028,round:1,originalTeamId:1,currentOwnerId:5,status:'AVAILABLE',source:'hlm-universe.json'});
 const state=importer.build(universe,1,engine);
 assert.equal(state.assets.draftPicks.length,1);
 assert.equal(state.assets.contracts.length,0);
 assert.equal(state.universe.prospects.length,0);
 assert.equal(engine.validateGameStateEnvelope(state).valid,true);
 assert.equal(universe.draftPicks.length,6);
});
test('absence of source picks preserves empty asset collections',()=>{
 const state=importer.build({teams,players},1,engine);
 assert.deepEqual(state.assets.draftPicks,[]);
 assert.deepEqual(state.assets.contracts,[]);
});
