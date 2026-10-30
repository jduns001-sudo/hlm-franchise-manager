'use strict';
const assert=require('node:assert/strict');
const {buildExperimentalGoalEvents:build,aggregateExperimentalGoals:aggregate}=require('./hlm-phase10-experimental-player-goals');
const state={universe:{players:[{id:101,teamId:1,position:'C',ovr:88},{id:102,teamId:1,position:'D',ovr:78},{id:201,teamId:2,position:'LW',ovr:81},{id:202,teamId:2,position:'G',ovr:90}]}};
const game={id:'G1',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:3,awayGoals:2};
const before=JSON.stringify(state);
const events=build(state,game,7);
assert.equal(events.length,5);
assert.equal(events.filter(e=>e.teamId===1).length,3);
assert.equal(events.filter(e=>e.teamId===2).length,2);
assert(!events.some(e=>e.playerId===202));
assert.deepEqual(events,build(state,game,7));
assert.equal(aggregate(events).reduce((n,p)=>n+p.goals,0),5);
assert.equal(JSON.stringify(state),before);
assert.throws(()=>build({universe:{players:[]}},game,7),/No eligible scoring players/);
// A-11: string team IDs must resolve to eligible, deterministic scorers without mutating state.
const stringState={meta:{controlledTeamId:'PIT'},universe:{players:[
 {id:'pit-c',teamId:'PIT',position:'C',ovr:88},
 {id:'pit-d',teamId:'PIT',position:'D',ovr:78},
 {id:'pit-injured',teamId:'PIT',position:'LW',ovr:90},
 {id:'pit-unapproved',teamId:'PIT',position:'RW',ovr:85},
 {id:'nyr-c',teamId:'NYR',position:'C',ovr:81},
 {id:'nyr-d',teamId:'NYR',position:'D',ovr:79},
 {id:'nyr-g',teamId:'NYR',position:'G',ovr:90}
]},activity:{injuries:[{playerId:'pit-injured',status:'out'}]},extensions:{
 phase11GmApprovedSkaters:{teamId:'PIT',playerIds:['pit-c','pit-d','pit-injured']}
}};
const stringGame={id:'G-STRING',status:'final',homeTeamId:'PIT',awayTeamId:'NYR',homeGoals:3,awayGoals:2};
const staleStringBefore=JSON.stringify(stringState);
assert.throws(()=>build(stringState,stringGame,7),/unavailable|injured/);
stringState.extensions.phase11GmApprovedSkaters.playerIds=['pit-c','pit-d','pit-unapproved'];
const stringBefore=JSON.stringify(stringState);
const stringEvents=build(stringState,stringGame,7);
assert.equal(stringEvents.length,5);
assert.deepEqual(stringEvents,build(stringState,stringGame,7));
assert(stringEvents.filter(e=>e.teamId==='PIT').every(e=>['pit-c','pit-d','pit-unapproved'].includes(e.playerId)));
assert(stringEvents.filter(e=>e.teamId==='NYR').every(e=>['nyr-c','nyr-d'].includes(e.playerId)));
assert(!stringEvents.some(e=>e.playerId==='pit-injured'||e.playerId==='nyr-g'));
assert.equal(aggregate(stringEvents).reduce((n,p)=>n+p.goals,0),5);
assert.equal(JSON.stringify(stringState),stringBefore);
assert.notEqual(JSON.stringify(stringState),staleStringBefore);
// Legacy numeric-ID selection remains unchanged.
assert.deepEqual(build(state,game,7),events);
console.log('Mission A-11 deterministic string team IDs, approved eligibility and numeric compatibility passed.');
console.log('Mission 747 experimental player goal stats tests passed.');
