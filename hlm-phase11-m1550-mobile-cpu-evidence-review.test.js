'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {reviewCpuTradeEvidence:nodeReview}=require('./hlm-phase11-m1549-cpu-trade-evidence-bridge');
const script=fs.readFileSync('hlm-phase11-m1550-browser-cpu-evidence-bridge.js','utf8');
const html=fs.readFileSync('hlm-phase11-m1507m-mobile-trade-review.html','utf8');
const context={};context.globalThis=context;vm.runInNewContext(script,context);
const browserReview=context.HLMPhase11CpuEvidenceBridge.review;
function state(){return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}}}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
for(const scenario of ['agreement','conflict','missing','stale','gm-denied','revision-stale']){
 const s=state();
 if(scenario==='conflict')s.extensions.cpuTradeDecisions[0].decision='decline';
 if(scenario==='missing')delete s.extensions.cpuTradeDecisions;
 if(scenario==='stale')s.extensions.cpuTradeDecisions[0].gameRevision=12;
 const i={...input};
 if(scenario==='gm-denied')i.gmApproved=false;
 if(scenario==='revision-stale')i.expectedGameRevision=12;
 const before=JSON.stringify(s),actual=browserReview(s,i),expected=nodeReview(s,i);
 assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,scenario);
 assert.equal(actual.saved,false);assert.equal(actual.consentAuthenticated,false);
 assert.equal(actual.settlementAuthorized,false);assert.equal(JSON.stringify(s),before);
}
assert.match(html,/hlm-phase11-m1550-browser-cpu-evidence-bridge\.js/);
assert.match(html,/HLMPhase11CpuEvidenceBridge\.review/);
assert.match(html,/Source CPU evidence:/);
assert.match(html,/Settlement: DISABLED/);
console.log('M1550 browser parity, mobile review wiring, six source scenarios and no-save passed');
