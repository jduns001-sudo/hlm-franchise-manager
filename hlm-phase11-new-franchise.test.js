'use strict';
const nativeAssert=require('node:assert/strict');
let assertions=0;
const assert=new Proxy(nativeAssert,{get:(target,key)=>typeof target[key]==='function'? (...args)=>{++assertions;return target[key](...args)}:target[key]});
const {teams,build}=require('./hlm-phase11-new-franchise');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule')};
const universe={teams:[{id:5,name:'Pittsburgh',abbr:'PIT'},{id:3,name:'New York',abbr:'NYR'},{id:200,name:'Minor',abbr:'MINOR'}],players:[{id:10,name:'A',teamId:5,ovr:82,retired:false},{id:11,name:'B',teamId:3,ovr:80,retired:false},{id:12,name:'Retired',teamId:5,retired:true}]};
assert.equal(teams(universe).length,2);
assert.throws(()=>build(universe,200,engine),/active NHL/);
const state=build(universe,5,engine);
assert.equal(state.meta.controlledTeamId,5);
assert.equal(state.universe.players.length,2);
assert.equal(state.activity.games.length,2);
assert.equal(state.extensions.phase11ExperimentalRosterAwareScores,false);
assert.equal(engine.validateGameStateEnvelope(state).valid,true);
assert.equal(state.activity.games[0].status,'scheduled');
assert.equal(state.meta.currentDate,'2026-10-20');
console.log('Mission 1381: real roster filtering, GameState validation, schedule and default-off passed');

// The shipped universe includes colliding abbreviations and active junior players.
const shipped=require('./hlm-universe.json');
const liveTeams=teams(shipped);
assert.equal(liveTeams.length,32,'exactly 32 canonical active NHL franchises');
assert.equal(new Set(liveTeams.map(t=>t.abbr)).size,32,'unique franchise abbreviations');
assert.deepEqual(liveTeams.filter(t=>t.abbr==='CGY').map(t=>t.id),[20]);
assert.deepEqual(liveTeams.filter(t=>t.abbr==='CHI').map(t=>t.id),[16]);
assert.ok(!liveTeams.some(t=>t.name==='Chicoutimi'||[207,244,130].includes(t.id)));
assert.ok(liveTeams.some(t=>t.id===2&&t.abbr==='LII'));
assert.throws(()=>build(shipped,207,engine),/active NHL/);
assert.throws(()=>build(shipped,244,engine),/active NHL/);
const duplicate={teams:[...universe.teams,{id:5,name:'Pittsburgh',abbr:'PIT'}],players:universe.players};
assert.throws(()=>teams(duplicate),/Duplicate canonical NHL/);
const spoof={teams:[{id:207,name:'Chicoutimi',abbr:'CHI'}],players:[{id:1,teamId:207,status:0}]};
assert.equal(teams(spoof).length,0);
console.log('Mission 1382: shipped universe canonical 32, collision exclusions and ambiguous duplicate rejection passed');

// Source-backed position overlay: permanent identities only, with all ambiguity left unresolved.
const {normalizePosition}=require('./hlm-phase11-new-franchise');
for(const [input,expected] of [['C','C'],['LW','LW'],['RW','RW'],['D','D'],['F','F'],['G','G'],['LD','D'],['RD','D'],['LD/RD','D'],['C/LW','C'],['RW/C','RW'],[' lw / rw ','LW']])assert.equal(normalizePosition(input),expected,input);
for(const input of [null,undefined,1,'','X','C/X','G/C','C/','/C'])assert.equal(normalizePosition(input),null,'unsupported evidence');
const make=rows=>build(universe,5,engine,{players:rows});
let overlay=make([{id:'10',name:'Not the canonical name',teamId:3,ovr:1,pos:'C/LW'},{id:11,teamId:5,pos:'G'},{id:12,pos:'G'}]);
assert.equal(overlay.universe.players[0].position,'C');assert.equal(overlay.universe.players[0].id,10);assert.equal(overlay.universe.players[0].name,'A');assert.equal(overlay.universe.players[0].teamId,5);assert.equal(overlay.universe.players[0].overall,82);
assert.equal(overlay.universe.players[1].teamId,3);assert.equal(overlay.universe.players[1].position,'G');assert.ok(!overlay.universe.players.some(p=>p.id===12));
assert.equal(make([{id:99,name:'A',pos:'C'}]).universe.players[0].position,null,'never match by name');
for(const rows of [[],[{id:'010',pos:'C'}],[{id:'10.0',pos:'C'}],[{id:10,pos:'X'}],[{id:10,pos:'C'},{id:10,pos:'G'}],[{id:10,pos:'C'},{id:10}],[{id:10,pos:'C/LW'},{id:10,pos:'C/RW'}],[{id:10,pos:'C',position:'G'}]]){
 assert.equal(make(rows).universe.players[0].position,null,'missing/invalid/ambiguous evidence unresolved');
 assert.equal(make(rows.slice().reverse()).universe.players[0].position,null,'row order does not resolve ambiguity');
}
assert.equal(make([{id:10,pos:'C/LW'},{id:'10',position:'c/lw'}]).universe.players[0].position,'C','identical duplicate evidence is safe');
assert.equal(make([{id:10,pos:'LD/RD'},{id:'10',pos:'D'}]).universe.players[0].position,'D','equivalent supported defense evidence');
assert.throws(()=>build(universe,5,engine,{}),/Position roster/);
const canonical=JSON.parse(JSON.stringify(universe));canonical.players[0].position='RW';assert.equal(build(canonical,5,engine,{players:[{id:10,pos:'G'}]}).universe.players[0].position,'RW','explicit canonical position retained');
canonical.players[0].pos='C';assert.equal(build(canonical,5,engine,{players:[{id:10,pos:'G'}]}).universe.players[0].position,null,'canonical field conflict remains unresolved');
const sourceRoster=require('./hlm-roster-2026.json');const sourceBefore=JSON.stringify(shipped),rosterBefore=JSON.stringify(sourceRoster);
const legacyReal=build(shipped,5,engine),real=build(shipped,5,engine,sourceRoster);
assert.equal(real.universe.teams.length,32);assert.equal(real.universe.players.length,1641);
assert.deepEqual(real.universe.players.map(({position,...p})=>p),legacyReal.universe.players.map(({position,...p})=>p),'all canonical player fields other than position remain identical');
assert.deepEqual(real.activity.games,legacyReal.activity.games,'schedule unchanged');assert.deepEqual(real.assets,legacyReal.assets,'contracts and draft rights unchanged');assert.deepEqual(real.extensions,legacyReal.extensions,'no schema/extension or scoring switch change');
assert.equal(JSON.stringify(shipped),sourceBefore,'universe input immutable');assert.equal(JSON.stringify(sourceRoster),rosterBefore,'roster input immutable');
const counts=real.universe.teams.map(t=>{const players=real.universe.players.filter(p=>String(p.teamId)===String(t.id));return {team:t.name,teamId:t.id,players:players.length,positioned:players.filter(p=>p.position!==null).length,unresolved:players.filter(p=>p.position===null).length,skaters:players.filter(p=>['C','LW','RW','D','F'].includes(p.position)).length,goalies:players.filter(p=>p.position==='G').length}});
for(const c of counts){assert.ok(c.skaters>=3,c.team+' source-backed skaters');assert.ok(c.goalies>=1,c.team+' source-backed goalie')}
assert.equal(real.extensions.phase11ExperimentalRosterAwareScores,false);
console.log('REAL_DATA_POSITION_COUNTS='+JSON.stringify(counts));
console.log('A22-S182 source-backed positions passed; assertions: '+assertions);
