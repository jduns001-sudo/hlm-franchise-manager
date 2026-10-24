'use strict';
const assert=require('node:assert/strict');
const {create}=require('./hlm-phase11-m1573-season-trade-source');
const universe=require('./hlm-universe.json');
const {build}=require('./hlm-phase11-new-franchise');
const {create:season}=require('./hlm-phase11-isolated-single-game');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule'),...require('./hlm-phase10-browser-storage'),
 ...require('./hlm-phase10-apply-game'),...require('./hlm-phase10-standings'),...require('./hlm-phase10-simulate-day')};
const memory=new Map([['hlm_front_office_v8','PRODUCTION_SENTINEL']]);
const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
const manager=season(engine,storage);
manager.stage(build(universe,5,engine),true);
const source=create(()=>manager.peek()),options=source.choices();
const request={outgoingPlayerId:options.outgoing[0].id,incomingPlayerId:options.incoming[0].id};
const before=storage.getItem(manager.key);
const real=source.preflight(request);
assert.equal(real.sourceDataComplete,false);
assert.equal(real.saved,false);assert.equal(real.settlementAuthorized,false);assert.equal(real.cpuConsentAuthenticated,false);
assert.ok(real.blockers.some(s=>s.includes('missing unique active contract evidence')));
assert.ok(real.financial.every(t=>t.projectedPayroll===null),'missing real source contracts never become invented payroll');
assert.equal(storage.getItem(manager.key),before);
assert.equal(storage.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
const make=()=>({meta:{revision:1,controlledTeamId:'A'},
 universe:{players:[{id:'a',name:'Alex',teamId:'A'},{id:'b',name:'Blair',teamId:'B'}],
 teams:[{id:'A',name:'Alpha'},{id:'B',name:'Beta'}]},
 assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},
 {playerId:'b',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}]},
 finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}});
let state=make();
const subject=create(()=>state),input={outgoingPlayerId:'a',incomingPlayerId:'b'};
subject.choices();
const valid=subject.preflight(input);
assert.equal(valid.sourceDataComplete,true,valid.blockers.join(', '));
assert.deepEqual(valid.financial.map(t=>[t.teamId,t.beforePayroll,t.projectedPayroll,t.capLimit]),[
 ['A',4,7,10],['B',7,4,10]]);
assert.equal(valid.saved,false);assert.equal(valid.settlementAuthorized,false);
assert.equal(valid.cpuConsentAuthenticated,false,'source evidence does not authenticate CPU decision');
assert.deepEqual(state,make(),'preflight never mutates input');
function check(mutator,reason){
 state=make();mutator(state);subject.choices();
 const result=subject.preflight(input);
 assert.equal(result.sourceDataComplete,false,reason);
 assert.ok(result.blockers.some(s=>s.includes(reason)),result.blockers.join('; '));
 assert.equal(result.settlementAuthorized,false);
}
check(s=>{s.assets.contracts=[]},'missing unique active contract evidence');
check(s=>{s.assets.contracts.push({...s.assets.contracts[0]})},'ambiguous active contract');
check(s=>{s.assets.contracts[0].teamId='B'},'invalid active contract ownership');
check(s=>{s.assets.contracts[0].aav=-1},'invalid active contract ownership');
check(s=>{s.assets.contracts[0].tradePermission='unknown'},'not explicitly allowed');
check(s=>{s.finances.teamCapLimits.A=5},'projected payroll exceeds source cap');
check(s=>{delete s.finances.teamCapLimits.A},'source team cap limit unavailable');
check(s=>{delete s.extensions.tradeRosterLimits.A},'source roster limit unavailable');
check(s=>{s.assets.contracts.push({playerId:'ghost',teamId:'B',status:'active',aav:1})},'without matching current roster ownership');
state=make();subject.choices();state.meta.revision++;
assert.throws(()=>subject.preflight(input),/Saved season changed/);
assert.equal(storage.getItem(manager.key),before,'synthetic tests never alter persisted real-universe save');
console.log('M1574 saved-season trade preflight: real missing contracts, complete synthetic cap math, contract/cap/roster fail-closed cases, stale review, no-save and production isolation passed');
