'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluate}=require('./hlm-phase11-m1507k-cpu-trade-policy');
const input={outgoingPlayerId:'a',incomingPlayerId:'b'};
function state(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
 players:[{id:'a',teamId:1,position:'C',overall:85},{id:'b',teamId:2,position:'D',overall:80}],
 contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
 {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 return s;
}
test('CPU valuation is deterministic, source-backed and never consent',()=>{
 const s=state(),before=JSON.stringify(s);
 const result=evaluate(s,input);
 assert.equal(result.status,'cpu-trade-evaluation-preview');
 assert.equal(result.recommendation,'favorable-for-receiving-team');
 assert.equal(result.receivingTeamRatingDelta,5);
 assert.equal(result.authenticatedCpuConsent,false);
 assert.equal(result.settlementAuthorized,false);
 assert.equal(result.saved,false);
 assert.equal(JSON.stringify(s),before);
});
test('unfavorable and even ratings are advice, not authority',()=>{
 const s=state();s.universe.players[0].overall=70;
 assert.equal(evaluate(s,input).recommendation,'unfavorable-for-receiving-team');
 s.universe.players[0].overall=80;
 assert.equal(evaluate(s,input).recommendation,'even-rating-exchange');
 assert.equal(evaluate(s,input).authenticatedCpuConsent,false);
});
test('missing or invalid ratings, caps, restrictions and spoofed flags fail closed',()=>{
 for(const modify of [
  s=>{delete s.universe.players[0].overall},
  s=>{s.universe.players[1].overall=200},
  s=>{s.finances.teamCapLimits[1]=3},
  s=>{s.assets.contracts[0].tradePermission='unknown'}
 ]){
  const s=state();modify(s);const before=JSON.stringify(s);
  const result=evaluate(s,{...input,gmApproved:true,receivingTeamConsent:true});
  assert.equal(result.status,'cpu-trade-evaluation-blocked');
  assert.equal(result.authenticatedCpuConsent,false);
  assert.equal(result.saved,false);
  assert.equal(JSON.stringify(s),before);
 }
});
