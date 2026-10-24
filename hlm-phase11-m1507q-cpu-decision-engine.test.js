'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {create}=require('./hlm-phase11-m1507q-cpu-decision-engine');
const input={outgoingPlayerId:'a',incomingPlayerId:'b'};
function state(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},
  teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
  players:[{id:'a',teamId:1,position:'C',overall:85},{id:'b',teamId:2,position:'D',overall:80}],
  contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
   {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};
 s.extensions.tradeRosterLimits={1:23,2:23};return s;
}
test('favorable proposal produces isolated CPU acceptance preview, not consent',()=>{
 const s=state(),before=JSON.stringify(s),engine=create();
 const r=engine.decide(s,{...input,gmApproved:true,receivingTeamConsent:true},'r1');
 assert.equal(r.status,'cpu-trade-decision-preview');
 assert.equal(r.decision,'accept');
 assert.equal(r.independentlyAuthenticated,false);
 assert.equal(r.authenticatedCpuConsent,false);
 assert.equal(r.replayProtected,false);
 assert.equal(r.settlementAuthorized,false);
 assert.equal(r.saved,false);
 assert.equal(JSON.stringify(s),before);
 assert.equal(engine.decide(s,input,'r1').code,'duplicate-proposal-in-session');
});
test('unfavorable proposal declines without granting settlement',()=>{
 const s=state();s.universe.players[0].overall=70;
 const r=create().decide(s,input,'r1');
 assert.equal(r.decision,'decline');
 assert.equal(r.saved,false);
 assert.equal(r.settlementAuthorized,false);
});
test('stale source restrictions and cancelled GM decision fail closed',()=>{
 const s=state(),engine=create();
 assert.equal(engine.decide(s,input,'r1',{cancelled:true}).code,'gm-declined-or-cancelled');
 s.assets.contracts[0].tradePermission='unknown';
 assert.equal(engine.decide(s,input,'r1').code,'source-eligibility-failed');
});
test('same input and revision on changed source gets distinct digest',()=>{
 const s=state(),engine=create(),a=engine.decide(s,input,'r1');
 s.universe.players[0].overall=90;
 const b=engine.decide(s,input,'r1');
 assert.notEqual(a.proposalDigest,b.proposalDigest);
 assert.equal(b.authenticatedCpuConsent,false);
});
