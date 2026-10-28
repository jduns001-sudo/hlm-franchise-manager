'use strict';
const assert=require('node:assert/strict');
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

// Position source is keyed by permanent ID, never the source roster's team.
const positionIndex=require('./hlm-phase11-new-franchise').positionIndex;
assert.equal(positionIndex([{id:10,pos:'G',teamId:3}]).get('10'),'G');
assert.equal(positionIndex([{id:10,pos:'G'},{id:'10',pos:'D'}]).get('10'),null);
assert.equal(positionIndex([{id:10,pos:'G'},{id:'10',pos:'D'},{id:10,pos:'G'}]).get('10'),null);
assert.equal(positionIndex([{id:10,pos:'G'}]).has('11'),false);
const verified=build(universe,5,engine,[{id:'10',teamId:3,pos:'G'},{id:'11',teamId:5,pos:'D'}]);
assert.equal(verified.universe.players.find(p=>p.id===10).position,'G');
assert.equal(verified.universe.players.find(p=>p.id===10).teamId,5);
assert.equal(verified.universe.players.find(p=>p.id===11).teamId,3);
assert.equal(build(universe,5,engine,[{id:10,pos:'G'},{id:10,pos:'D'}]).universe.players.find(p=>p.id===10).position,null);
console.log('Position source: ID match, conflict rejection, missing position, stale team ownership passed');
