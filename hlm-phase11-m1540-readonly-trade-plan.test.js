'use strict';
const assert=require('node:assert/strict');
const {planTrade}=require('./hlm-phase11-m1540-readonly-trade-plan');
function source(){
 return {meta:{revision:4,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],
  players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
  assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},
   {playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},
  finances:{teamCapLimits:{A:5,B:5}},extensions:{tradeRosterLimits:{A:2,B:2}}};
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:4};
const state=source(),before=JSON.stringify(state),good=planTrade(state,input);
assert.equal(good.ok,true);assert.equal(good.saved,false);assert.equal(good.settlementAuthorized,false);
assert.equal(good.consentStatus,'receiving-team-consent-not-authenticated');
assert.deepEqual(good.transfers.map(t=>[t.playerId,t.fromTeamId,t.toTeamId]),[['a','A','B'],['b','B','A']]);
assert.equal(JSON.stringify(state),before);
assert.equal(planTrade(state,{...input,gmApproved:false}).code,'human-gm-approval-required');
assert.equal(planTrade(state,{...input,expectedGameRevision:3}).code,'stale-game-revision');
assert.equal(planTrade(state,{...input,cpuConsentAuthenticated:true,cpuConsentEvidence:{approved:true,sourceVerified:true,teamId:'B'}}).settlementAuthorized,false);
function denied(change,code){const s=source();change(s);assert.equal(planTrade(s,input).code,code)}
denied(s=>s.assets.contracts.pop(),'missing-or-mismatched-active-contract');
denied(s=>s.assets.contracts.push({...s.assets.contracts[0]}),'missing-or-mismatched-active-contract');
denied(s=>s.assets.contracts[0].teamId='B','missing-or-mismatched-active-contract');
denied(s=>s.assets.contracts[0].tradePermission='denied','trade-restricted');
denied(s=>s.finances.teamCapLimits.A=2,'salary-cap-exceeded');
denied(s=>s.extensions.tradeRosterLimits.A=0,'roster-limit-unverified');
denied(s=>s.assets.contracts[0].aav=NaN,'source-financial-evidence-required');
denied(s=>s.meta.controlledTeamId='B','invalid-team-ownership');
console.log('M1540 read-only plan, source validation, forged consent resistance and no-save checks passed');
