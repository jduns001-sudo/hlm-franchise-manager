'use strict';
const assert=require('node:assert/strict');
const {createIsolatedTradeSettlementEngine:create}=require('./hlm-phase11-m1558-atomic-settlement-boundary');
function fixture(){return {meta:{revision:19,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}}}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:19};
function check(overrides={},request={},expected){const state=fixture(),before=JSON.stringify(state);let writes=0;const engine=create({storageKey:'hlm-m1558-isolated',readCurrent:()=>state,compareAndSwap:()=>{writes++;throw Error('unexpected write')},...overrides});const result=engine.requestSettlement({state,input,...request});assert.equal(result.code,expected);assert.equal(result.ok,false);assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);assert.equal(writes,0);assert.equal(JSON.stringify(state),before)}
check({}, {},'independent-cpu-authorization-required');
check({authorizeCpu:()=>({approved:true})},{},'trusted-cpu-authorizer-not-integrated');
check({authorizeCpu:()=>true},{input:{...input,cpuConsentApproved:true,consentAuthenticated:true}},'trusted-cpu-authorizer-not-integrated');
check({storageKey:'hlm_front_office_v8',authorizeCpu:()=>true},{},'isolated-storage-required');
check({compareAndSwap:undefined,authorizeCpu:()=>true},{},'atomic-store-required');
check({readCurrent:()=>null,authorizeCpu:()=>true},{},'persisted-source-required');
check({authorizeCpu:()=>true},{state:{...fixture(),meta:{revision:18,controlledTeamId:'A'}}},'stale-persisted-source');
check({authorizeCpu:()=>true},{input:{...input,gmApproved:false}},'human-gm-approval-required');
check({authorizeCpu:()=>true},{input:{...input,expectedGameRevision:18}},'stale-game-revision');
console.log('M1558 isolated atomic settlement boundary fail-closed Node tests passed');
