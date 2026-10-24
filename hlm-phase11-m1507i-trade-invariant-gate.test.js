'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {propose}=require('./hlm-phase11-m1507h-trade-proposal');
const {inspect}=require('./hlm-phase11-m1507i-trade-invariant-gate');
const input={outgoingPlayerId:'a',incomingPlayerId:'b'};
function source(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
 players:[{id:'a',teamId:1,position:'C'},{id:'b',teamId:2,position:'D'}],
 contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
 {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 return s;
}
test('source-backed detached player and contract proposal verifies without settlement or writes',()=>{
 const s=source(),before=JSON.stringify(s),candidate=propose(s,input).nextState;
 const result=inspect(s,input,candidate);
 assert.equal(result.status,'trade-proposal-invariants-verified');
 assert.equal(result.settlementAuthorized,false);assert.equal(result.saved,false);
 assert.equal(result.independentCpuConsentVerified,false);
 assert.equal(JSON.stringify(s),before);
});
test('tampered player, contract, cap, picks and metadata all fail closed',()=>{
 const s=source(),baseline=JSON.stringify(s);
 for(const tamper of [
  x=>x.universe.players[0].teamId=1,
  x=>x.assets.contracts[0].teamId=1,
  x=>x.assets.contracts[0].aav=999,
  x=>x.finances.teamCapLimits[1]=999,
  x=>x.assets.draftPicks.push({pickId:'fabricated'}),
  x=>x.meta.controlledTeamId=2
 ]){
  const c=propose(s,input).nextState;tamper(c);
  const result=inspect(s,input,c);
  assert.equal(result.status,'trade-proposal-blocked');
  assert.equal(result.settlementAuthorized,false);
  assert.equal(JSON.stringify(s),baseline);
 }
});
test('invalid source and untrusted approval flags cannot grant settlement',()=>{
 const s=source();s.assets.contracts[0].tradePermission='unknown';
 const result=inspect(s,{...input,gmApproved:true,receivingTeamConsent:true},{});
 assert.equal(result.code,'invalid-source-proposal');
 assert.equal(result.saved,false);
});
