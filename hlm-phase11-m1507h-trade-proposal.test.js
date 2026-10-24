'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {propose}=require('./hlm-phase11-m1507h-trade-proposal');
const input={outgoingPlayerId:'home-c',incomingPlayerId:'cpu-d'};
function state(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1,name:'Home'},{id:2,name:'CPU'}],
  players:[{id:'home-c',teamId:1,position:'C'},{id:'cpu-d',teamId:2,position:'D'}],
  contracts:[{playerId:'home-c',teamId:1,status:'active',aav:4,tradePermission:'allowed'},
   {playerId:'cpu-d',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};
 s.extensions.tradeRosterLimits={1:23,2:23};
 return s;
}
test('source-backed player and contract preview is atomic in memory, with no source mutation or settlement',()=>{
 const s=state(),before=JSON.stringify(s),{nextState,review}=propose(s,input);
 assert.equal(JSON.stringify(s),before);
 assert.deepEqual(nextState.universe.players.map(p=>p.teamId),[2,1]);
 assert.deepEqual(nextState.assets.contracts.map(c=>c.teamId),[2,1]);
 assert.equal(review.financialReviewed,true);assert.equal(review.restrictionsReviewed,true);
 assert.equal(review.settlementAuthorized,false);assert.equal(review.saved,false);
 assert.equal(review.requiresIndependentCpuConsent,true);
 assert.equal(review.requiresHumanGmApproval,true);
 assert.equal(nextState.assets.draftPicks.length,0);
});
test('cap, restriction, missing contracts and roster authority fail closed',()=>{
 for(const change of [
  s=>{s.finances.teamCapLimits[1]=4},
  s=>{s.assets.contracts[0].tradePermission='unknown'},
  s=>{s.assets.contracts.pop()},
  s=>{delete s.extensions.tradeRosterLimits},
  s=>{s.assets.contracts.push({...s.assets.contracts[0]})},
  s=>{s.universe.players[0].teamId=2}
 ]){
  const s=state();change(s);const before=JSON.stringify(s);
  assert.throws(()=>propose(s,input));
  assert.equal(JSON.stringify(s),before);
 }
});
test('no caller-supplied consent or approval flag can authorize settlement',()=>{
 const s=state();const before=JSON.stringify(s);
 const result=propose(s,{...input,receivingTeamConsent:true,gmApproved:true,productionEnabled:true});
 assert.equal(result.review.settlementAuthorized,false);
 assert.equal(result.review.saved,false);
 assert.equal(JSON.stringify(s),before);
});
