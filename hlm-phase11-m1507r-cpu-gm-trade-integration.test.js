'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {create}=require('./hlm-phase11-m1507j-guarded-trade-workflow');
function state(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},
  teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
  players:[{id:'a',teamId:1,position:'C',overall:85},{id:'b',teamId:2,position:'D',overall:80}],
  contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
   {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};
 s.extensions.tradeRosterLimits={1:23,2:23};return s;
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b'};
function storage(s){
 const map=new Map([['hlm-phase11-isolated-test',JSON.stringify(s)]]);
 return {getItem:k=>map.get(k)||null,setItem:(k,v)=>{throw Error('Trade review must not write storage')},raw:()=>map.get('hlm-phase11-isolated-test')};
}
test('GM sees deterministic CPU decision without authenticated consent or save',()=>{
 const store=storage(state()),before=store.raw(),w=create(store,'hlm-phase11-isolated-test');
 const result=w.review(input);
 assert.equal(result.status,'awaiting-human-GM-decision');
 assert.equal(result.cpuDecision.status,'cpu-trade-decision-preview');
 assert.equal(result.cpuDecision.decision,'accept');
 assert.equal(result.cpuDecision.authenticatedCpuConsent,false);
 assert.equal(result.cpuDecision.settlementAuthorized,false);
 assert.equal(w.decide('approve').code,'cpu-authority-and-atomic-settlement-unavailable');
 assert.equal(store.raw(),before);
});
test('decline and cancel never save',()=>{
 for(const action of ['decline','cancel']){
  const store=storage(state()),before=store.raw(),w=create(store,'hlm-phase11-isolated-test');
  assert.equal(w.review(input).status,'awaiting-human-GM-decision');
  assert.equal(w.decide(action).code,action);
  assert.equal(store.raw(),before);
 }
});
test('repeat review is preview-only and session duplicate cannot settle',()=>{
 const store=storage(state()),w=create(store,'hlm-phase11-isolated-test');
 assert.equal(w.review(input).cpuDecision.decision,'accept');
 assert.equal(w.review(input).cpuDecision.code,'duplicate-proposal-in-session');
 assert.equal(w.decide('approve').saved,false);
});
