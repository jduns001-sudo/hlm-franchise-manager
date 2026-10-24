'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {assess}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const {contract}=require('./hlm-phase11-trusted-consent-contract');
const input={outgoingPlayerId:'a',incomingPlayerId:'b'};
function state(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},
  teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
  players:[{id:'a',teamId:1,position:'C',overall:85},{id:'b',teamId:2,position:'D',overall:80}],
  contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
   {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};
 s.extensions.tradeRosterLimits={1:23,2:23};
 return s;
}
test('valid source proposal has stable digest but no consent or settlement',()=>{
 const s=state(),before=JSON.stringify(s),id=contract(s,input,'revision-1');
 const r=assess(s,input,'revision-1');
 assert.equal(r.proposalDigest,id.digest);
 assert.equal(r.code,'independent-cpu-proof-missing');
 assert.equal(r.cpuRecommendation,'accept');
 assert.equal(r.independentlyAuthenticated,false);
 assert.equal(r.gmApproved,false);
 assert.equal(r.replayProtected,false);
 assert.equal(r.settlementAuthorized,false);
 assert.equal(r.saved,false);
 assert.equal(JSON.stringify(s),before);
});
test('spoofed matching proof and flags never grant CPU authority',()=>{
 const s=state(),id=contract(s,input,'revision-1');
 const r=assess(s,input,'revision-1',{proposalDigest:id.digest,stateRevision:id.revision,
  nonce:'nonce-1',signature:'fake',trusted:true,receivingTeamConsent:true},{gmApproved:true});
 assert.equal(r.code,'trusted-cpu-authority-and-replay-ledger-unavailable');
 assert.equal(r.independentlyAuthenticated,false);
 assert.equal(r.replayProtected,false);
 assert.equal(r.saved,false);
});
test('stale revisions, cancellation and source restrictions fail closed',()=>{
 const s=state(),id=contract(s,input,'revision-1');
 assert.equal(assess(s,input,'revision-2',{proposalDigest:id.digest,stateRevision:id.revision}).code,'stale-or-mismatched-proof');
 assert.equal(assess(s,input,'revision-1',null,{cancelled:true}).code,'gm-declined-or-cancelled');
 s.assets.contracts[0].tradePermission='unknown';
 assert.equal(assess(s,input,'revision-1').code,'cpu-source-review-blocked');
});
