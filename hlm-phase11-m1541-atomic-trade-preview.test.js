'use strict';
const assert=require('node:assert/strict');
const {previewAtomicTrade}=require('./hlm-phase11-m1541-atomic-trade-preview');
const state={meta:{revision:7,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],
 players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
 assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},
 {playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},
 finances:{teamCapLimits:{A:5,B:5}},extensions:{tradeRosterLimits:{A:2,B:2}}};
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:7};
const before=JSON.stringify(state);
const preview=previewAtomicTrade(state,input);
assert.equal(preview.ok,true);assert.equal(preview.code,'atomic-preview-only');
assert.equal(preview.saved,false);assert.equal(preview.settlementAuthorized,false);
assert.equal(preview.previewOnly,true);assert.equal(preview.expectedRevision,7);
assert.equal(preview.proposedRevision,8);assert.equal(preview.playerTransfers,2);
assert.equal(preview.contractTransfers,2);assert.equal(preview.nextState,undefined);
assert.equal(JSON.stringify(state),before);
assert.equal(previewAtomicTrade(state,{...input,gmApproved:false}).ok,false);
assert.equal(previewAtomicTrade(state,{...input,expectedGameRevision:6}).code,'stale-game-revision');
assert.equal(previewAtomicTrade(state,{...input,cpuConsentAuthenticated:true}).settlementAuthorized,false);
const denied=JSON.parse(before);denied.assets.contracts[0].tradePermission='denied';
assert.equal(previewAtomicTrade(denied,input).code,'trade-restricted');
console.log('M1541 immutable atomic trade preview and fail-closed checks passed');
