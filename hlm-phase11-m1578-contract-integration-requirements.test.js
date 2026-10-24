'use strict';
const assert=require('node:assert/strict');
const {create}=require('./hlm-phase11-m1578-contract-integration-requirements');
const board=require('./hlm-phase11-m1577-contract-evidence-board');
const provenance=require('./hlm-phase11-m1576-contract-provenance-readiness');
const {build}=require('./hlm-phase11-new-franchise');
const universe=require('./hlm-universe.json');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule')};
let state=null,writeCount=0,production='PRODUCTION_SENTINEL';
const reader=()=>state?JSON.parse(JSON.stringify(state)):null;
const gate=create(reader,board,provenance);
assert.equal(gate.refresh().ready,false);
state=build(universe,5,engine);
const original=JSON.stringify(state);
const real=gate.refresh();
assert.equal(real.ready,true);
assert.equal(real.teamCount,32);
assert.equal(real.saved,false);assert.equal(real.importAuthorized,false);
assert.equal(real.settlementAuthorized,false);assert.equal(real.realSeasonIntegrationReady,false);
assert.equal(real.sourceAuthenticated,false);assert.equal(real.explicitGmApprovalRecorded,false);
assert.ok(real.blockers.some(x=>x.includes('No independently authenticated')));
assert.ok(real.blockers.some(x=>x.includes('missing active contracts')));
assert.equal(JSON.stringify(state),original,'real starter universe never changes');
const synthetic=()=>({meta:{revision:1,controlledTeamId:'A'},universe:{teams:[{id:'A',name:'Alpha'},{id:'B',name:'Beta'}],
 players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[
 {playerId:'a',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'b',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}]},
 finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}});
state=synthetic();gate.refresh();
const complete=gate.review();
assert.ok(complete.coverage.every(x=>x.sourceComplete),'financial/roster fixture passes limited coverage only');
assert.equal(complete.importAuthorized,false,'complete synthetic inputs cannot authorize contract import');
assert.ok(complete.blockers.some(x=>x.includes('publisher')));
assert.deepEqual(state,synthetic());
state.meta.revision++;
assert.throws(()=>gate.review(),/changed/);
assert.throws(()=>gate.review(),/Refresh/);
state=synthetic();gate.refresh();assert.equal(gate.cancel().saved,false);
assert.throws(()=>gate.review(),/Refresh/);
assert.equal(writeCount,0);assert.equal(production,'PRODUCTION_SENTINEL');
console.log('M1578 real saved-season blocker gate, synthetic coverage, untrusted publisher, stale revision, no-save decline and production isolation passed');
