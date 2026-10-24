'use strict';
const assert=require('node:assert/strict');
const {requestCpuTradeSettlement:request}=require('./hlm-phase11-m1556-cpu-settlement-gate');
function fixture(){return {meta:{revision:19,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}}}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:19};
function check(state,overrides={},expected){const before=JSON.stringify(state);let writes=0,reads=0;const args={state,input,storageKey:'hlm-m1556-isolated',readCurrent:()=>{reads++;return state},writeCurrent:()=>{writes++;throw Error('must never write')},...overrides};const result=request(args);assert.equal(result.code,expected);assert.equal(result.ok,false);assert.equal(result.saved,false);assert.equal(result.consentAuthenticated,false);assert.equal(result.settlementAuthorized,false);assert.equal(writes,0);assert.equal(JSON.stringify(state),before);return {result,reads}}
check(fixture(),{},'receiving-team-consent-not-authenticated');
check(fixture(),{storageKey:'hlm_front_office_v8'},'isolated-storage-required');
check(fixture(),{readCurrent:undefined},'source-reader-required');
check(fixture(),{readCurrent:()=>null},'persisted-source-required');
const stale=fixture();check(stale,{state:{...stale,meta:{...stale.meta,revision:18}}},'stale-persisted-source');
check(fixture(),{input:{...input,gmApproved:false}},'human-gm-approval-required');
check(fixture(),{input:{...input,expectedGameRevision:18}},'stale-game-revision');
const decline=fixture();decline.assets.contracts[0].aav=4;check(decline,{},'cpu-policy-declined');
const restricted=fixture();restricted.assets.contracts[0].tradePermission='denied';check(restricted,{},'trade-restricted');
const overcap=fixture();overcap.finances.teamCapLimits.B=1;check(overcap,{},'salary-cap-exceeded');
const forged=fixture();forged.extensions.cpuTradeConsentEvidence=[{decision:'accept'}];check(forged,{input:{...input,cpuConsentApproved:true,consentAuthenticated:true}},'receiving-team-consent-not-authenticated');
const drift=fixture();let reads=0;const snapshot=JSON.parse(JSON.stringify(drift));const outcome=request({state:drift,input,storageKey:'hlm-m1556-isolated',readCurrent:()=>{reads++;return reads===1?snapshot:{...snapshot,meta:{...snapshot.meta,revision:20}}},writeCurrent:()=>{throw Error('write')}});assert.equal(outcome.code,'stale-persisted-source');assert.equal(outcome.saved,false);
console.log('M1556 fail-closed settlement gate Node acceptance passed');
