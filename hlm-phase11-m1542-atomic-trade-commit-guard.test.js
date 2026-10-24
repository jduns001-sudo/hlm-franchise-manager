'use strict';
const assert=require('node:assert/strict');
const {requestAtomicTradeCommit}=require('./hlm-phase11-m1542-atomic-trade-commit-guard');
const state={meta:{revision:9,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],
 players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
 assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},
 {playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},
 finances:{teamCapLimits:{A:5,B:5}},extensions:{tradeRosterLimits:{A:2,B:2}}};
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:9,
 cpuConsentAuthenticated:true,cpuConsentEvidence:{teamId:'B',approved:true,sourceVerified:true}};
let writes=0,reads=0;const original=JSON.stringify(state);
const args={state,input,storageKey:'hlm-m1542-isolated',readCurrent:()=>{reads++;return state},
 writeCurrent:()=>{writes++;throw Error('must never write')}};
const valid=requestAtomicTradeCommit(args);
assert.equal(valid.code,'receiving-team-consent-not-authenticated');
assert.equal(valid.saved,false);assert.equal(valid.settlementAuthorized,false);
assert.equal(valid.expectedRevision,9);assert.equal(writes,0);
assert.equal(requestAtomicTradeCommit({...args,storageKey:'hlm_front_office_v8'}).code,'isolated-storage-required');
assert.equal(requestAtomicTradeCommit({...args,storageKey:'production'}).code,'isolated-storage-required');
assert.equal(requestAtomicTradeCommit({...args,readCurrent:()=>({...state,meta:{...state.meta,revision:10}})}).code,'stale-persisted-source');
assert.equal(requestAtomicTradeCommit({...args,input:{...input,gmApproved:false}}).code,'human-gm-approval-required');
assert.equal(requestAtomicTradeCommit({...args,input:{...input,expectedGameRevision:8}}).code,'stale-game-revision');
assert.equal(writes,0);assert.equal(JSON.stringify(state),original);
assert.ok(reads>=1);
console.log('M1542 isolated commit gate rejects unauthenticated consent and all writes');
