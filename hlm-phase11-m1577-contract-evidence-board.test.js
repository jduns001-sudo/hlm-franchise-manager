'use strict';
const assert=require('node:assert/strict');
const {create}=require('./hlm-phase11-m1577-contract-evidence-board');
const universe=require('./hlm-universe.json');
const {build}=require('./hlm-phase11-new-franchise');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule')};
const real=build(universe,5,engine);
let state=real, reads=0;
const reader=()=>{reads++;return JSON.parse(JSON.stringify(state))};
const board=create(reader);
const first=board.refresh(),review=board.review();
assert.equal(first.ready,true);
assert.equal(first.sourceAuthenticated,false);
assert.equal(first.settlementAuthorized,false);
assert.equal(review.teams.length,32);
assert.ok(review.teams.some(t=>t.roster>0&&t.missing===t.roster));
assert.ok(review.teams.every(t=>t.sourceAuthenticated===false));
assert.ok(review.teams.every(t=>t.capLimit===null));
assert.ok(review.teams.every(t=>t.blockers.includes('team cap unavailable')));
assert.deepEqual(state,real);
const fixture=()=>({meta:{revision:1,controlledTeamId:'A'},
 universe:{teams:[{id:'A',name:'Alpha'},{id:'B',name:'Beta'}],
 players:[{id:'a',teamId:'A'},{id:'c',teamId:'A'},{id:'b',teamId:'B'}]},
 assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'c',teamId:'A',status:'active',aav:1,tradePermission:'restricted'},
 {playerId:'b',teamId:'B',status:'active',aav:5}]},
 finances:{teamCapLimits:{A:10,B:11}},extensions:{tradeRosterLimits:{A:3,B:3}}});
state=fixture();board.refresh();const result=board.review();const a=result.teams.find(t=>t.teamId==='A'),b=result.teams.find(t=>t.teamId==='B');
assert.equal(a.matched,2);assert.equal(a.payroll,5);assert.equal(a.restricted,1);
assert.equal(b.unknownPermission,1);assert.equal(b.payroll,5);
assert.equal(a.sourceComplete,false);assert.equal(b.sourceComplete,false);
assert.deepEqual(state,fixture(),'never mutate saved season');
state=fixture();state.assets.contracts[0].teamId='B';board.refresh();
assert.ok(board.review().teams.find(t=>t.teamId==='A').blockers.some(x=>x.includes('invalid contract')));
state=fixture();state.meta.revision=2;
assert.throws(()=>board.review(),/changed/);
assert.throws(()=>board.review(),/Refresh/);
state=fixture();board.refresh();assert.equal(board.cancel().saved,false);
assert.throws(()=>board.review(),/Refresh/);
assert.ok(reads>0);
console.log('M1577 read-only real 32-team contract coverage, synthetic valid math/restrictions, ownership conflict, stale and decline no-save passed');
