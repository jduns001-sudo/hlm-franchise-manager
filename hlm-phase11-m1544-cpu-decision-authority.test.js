'use strict';
const assert=require('node:assert/strict');
const {evaluateCpuTrade:evaluate}=require('./hlm-phase11-m1544-cpu-decision-authority');
function source(aavA=2,aavB=3){
 return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],
 players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
 assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:aavA,tradePermission:'allowed'},
 {playerId:'b',teamId:'B',status:'active',aav:aavB,tradePermission:'allowed'}]},
 finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}};
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
const state=source(),before=JSON.stringify(state);
const accept=evaluate(state,{...input,cpuConsentAuthenticated:false,cpuDecision:'decline'});
assert.equal(accept.ok,true);assert.equal(accept.decision,'accept');assert.equal(accept.receivingTeamId,'B');
assert.equal(accept.consentAuthenticated,false);assert.equal(accept.settlementAuthorized,false);
assert.equal(accept.saved,false);assert.equal(JSON.stringify(state),before);
const decline=evaluate(source(4,3),{...input,cpuConsentAuthenticated:true,cpuDecision:'accept'});
assert.equal(decline.decision,'decline');assert.equal(decline.consentAuthenticated,false);
assert.equal(evaluate(state,{...input,gmApproved:false}).code,'human-gm-approval-required');
assert.equal(evaluate(state,{...input,expectedGameRevision:12}).code,'stale-game-revision');
const restricted=source();restricted.assets.contracts[0].tradePermission='denied';
assert.equal(evaluate(restricted,input).code,'trade-restricted');
assert.equal(evaluate(source(12,3),input).code,'salary-cap-exceeded');
console.log('M1544 independent deterministic CPU decision, rejection and no-save checks passed');
