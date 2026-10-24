'use strict';
const assert=require('node:assert/strict');
const {reviewCpuTradeAuthorization:review}=require('./hlm-phase11-m1552-cpu-trade-authorization-review');
function fixture(){
 return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
 assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},
 finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},
 cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}};
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
function check(state,patch,expected,readCurrent=()=>state,storageKey='hlm-m1552-isolated'){
 const before=JSON.stringify(state),r=review({state,input:{...input,...patch},readCurrent,storageKey});
 assert.equal(r.code,expected);assert.equal(r.ok,false);assert.equal(r.saved,false);
 assert.equal(r.consentAuthenticated,false);assert.equal(r.settlementAuthorized,false);
 assert.equal(JSON.stringify(state),before);return r;
}
check(fixture(),{},'receiving-team-consent-not-authenticated');
check(fixture(),{gmApproved:false},'human-gm-approval-required');
check(fixture(),{expectedGameRevision:12},'stale-game-revision');
const conflict=fixture();conflict.extensions.cpuTradeDecisions[0].decision='decline';
check(conflict,{},'cpu-decision-not-agreed');
const missing=fixture();delete missing.extensions.cpuTradeDecisions;
check(missing,{},'cpu-evidence-unavailable');
const restricted=fixture();restricted.assets.contracts[0].tradePermission='denied';
check(restricted,{},'trade-restricted');
const overcap=fixture();overcap.finances.teamCapLimits.B=1;
check(overcap,{},'salary-cap-exceeded');
const stale=fixture();check(stale,{},'stale-persisted-source',()=>({...stale,meta:{...stale.meta,revision:14}}));
check(fixture(),{},'isolated-storage-required',undefined,'hlm_front_office_v8');
let writes=0;const s=fixture();const before=JSON.stringify(s);
const result=review({state:s,input,readCurrent:()=>s,writeCurrent:()=>{writes++;},storageKey:'hlm-m1552-isolated'});
assert.equal(writes,0);assert.equal(result.saved,false);assert.equal(JSON.stringify(s),before);
console.log('M1552 CPU authorization read-only, GM/cap/revision/evidence/consent/no-write passed');
