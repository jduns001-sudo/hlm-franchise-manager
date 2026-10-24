'use strict';
const assert=require('node:assert/strict');
const {verifyCpuDecisionEvidence:verify}=require('./hlm-phase11-m1543-cpu-decision-evidence');
function fixture(){
 return {meta:{revision:11,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],
  players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
  assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},
   {playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},
  finances:{teamCapLimits:{A:5,B:5}},extensions:{tradeRosterLimits:{A:2,B:2},
   cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:11,decision:'accept'}]}};
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:11};
const state=fixture(),before=JSON.stringify(state),good=verify(state,input);
assert.equal(good.ok,true);assert.equal(good.decision,'accept');
assert.equal(good.consentAuthenticated,false);assert.equal(good.settlementAuthorized,false);assert.equal(good.saved,false);
assert.equal(JSON.stringify(state),before);
function denied(change,code){const s=fixture();change(s);assert.equal(verify(s,input).code,code)}
denied(s=>delete s.extensions.cpuTradeDecisions,'source-cpu-decision-ledger-required');
denied(s=>s.extensions.cpuTradeDecisions.push({...s.extensions.cpuTradeDecisions[0]}),'unique-source-cpu-decision-required');
denied(s=>s.extensions.cpuTradeDecisions[0].gameRevision=10,'stale-cpu-decision');
denied(s=>s.extensions.cpuTradeDecisions[0].receivingTeamId='A','unique-source-cpu-decision-required');
denied(s=>s.extensions.cpuTradeDecisions[0].decision='unknown','invalid-cpu-decision');
denied(s=>s.assets.contracts[0].tradePermission='denied','trade-restricted');
const decline=fixture();decline.extensions.cpuTradeDecisions[0].decision='decline';
assert.equal(verify(decline,input).decision,'decline');
assert.equal(verify(decline,input).consentAuthenticated,false);
assert.equal(verify(state,{...input,expectedGameRevision:10}).code,'stale-game-revision');
assert.equal(verify(state,{...input,cpuConsentAuthenticated:true,sourceVerified:true}).consentAuthenticated,false);
console.log('M1543 CPU decision evidence binding, decline and no-authentication passed');
