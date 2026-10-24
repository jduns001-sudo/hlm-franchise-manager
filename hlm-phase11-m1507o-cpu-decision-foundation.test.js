'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {review}=require('./hlm-phase11-m1507o-cpu-decision-foundation');
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
test('favorable source-backed CPU recommendation cannot grant consent or save',()=>{
 const s=state(),before=JSON.stringify(s);
 const a=review(s,{...input,receivingTeamConsent:true,gmApproved:true});
 const b=review(s,input);
 assert.equal(a.status,'cpu-review-recommends-accept');
 assert.equal(a.receivingTeamRecommendation,'accept');
 assert.equal(a.independentlyAuthenticated,false);
 assert.equal(a.authenticatedCpuConsent,false);
 assert.equal(a.settlementAuthorized,false);
 assert.equal(a.saved,false);
 assert.equal(a.humanGmApprovalRequired,true);
 assert.equal(b.status,a.status);
 assert.equal(JSON.stringify(s),before);
});
test('unfavorable and even exchanges do not imply CPU acceptance',()=>{
 const s=state();
 s.universe.players[0].overall=70;
 assert.equal(review(s,input).status,'cpu-review-recommends-decline');
 s.universe.players[0].overall=80;
 assert.equal(review(s,input).status,'cpu-review-recommends-decline');
});
test('missing source values, restrictions and cap evidence block recommendation',()=>{
 for(const mutate of [
  s=>{delete s.universe.players[0].overall},
  s=>{s.assets.contracts[0].tradePermission='unknown'},
  s=>{s.finances.teamCapLimits[1]=3}
 ]){
  const s=state();mutate(s);const before=JSON.stringify(s);
  const r=review(s,{...input,receivingTeamConsent:true});
  assert.equal(r.status,'cpu-review-blocked');
  assert.equal(r.authenticatedCpuConsent,false);
  assert.equal(r.saved,false);
  assert.equal(JSON.stringify(s),before);
 }
});
