'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createTradeExecutionBoundary}=require('./hlm-phase11-trade-execution-boundary');
const {inspect}=require('./hlm-phase11-trade-settlement-readiness');
const {contract}=require('./hlm-phase11-trusted-consent-contract');
function franchise(){
 const state=createGameStateEnvelope({
  meta:{controlledTeamId:1,saveId:'mission-1460-isolated'},
  teams:[{id:1,name:'Home'},{id:2,name:'CPU'}],
  players:[{id:'home-c',teamId:1,position:'C'},{id:'cpu-d',teamId:2,position:'D'}],
  contracts:[{playerId:'home-c',teamId:1,status:'active',aav:4,tradePermission:'allowed'},
   {playerId:'cpu-d',teamId:2,status:'active',aav:5,tradePermission:'allowed'}],
  draftPicks:[{id:'pick-2028-1',teamId:1,originalTeamId:1,year:2028,round:1}]
 });
 state.finances.teamCapLimits={1:10,2:10};
 state.extensions.tradeRosterLimits={1:23,2:23};
 state.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'home-c',incomingPlayerId:'cpu-d',decision:'accepted',source:'receiving-team-authority'}];
 return state;
}
const proposal={outgoingPlayerId:'home-c',incomingPlayerId:'cpu-d',receivingTeamConsent:true};
function storage(state=franchise()){let data=JSON.stringify(state),writes=0;return {
 getItem:()=>data,setItem:()=>{writes++},external:value=>{data=value},snapshot:()=>data,writes:()=>writes
};}
test('real envelope: cap, roster, contract and receiving-team claim reviewed, but settlement blocked',()=>{
 const s=franchise(),before=JSON.stringify(s);
 const r=inspect(s,proposal);
 assert.equal(r.financialReviewed,true);assert.equal(r.restrictionsReviewed,true);
 assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);
 assert.equal(s.assets.draftPicks[0].id,'pick-2028-1');
 assert.equal(JSON.stringify(s),before);
 const binding=contract(s,proposal,'franchise-rev-1');
 assert.equal(binding.proposal.receivingTeamId,'2');
 assert.equal(typeof binding.digest,'string');
});
test('human GM approve, decline, cancel and repeated approval never mutate franchise or picks',()=>{
 for(const action of ['approve','decline','cancel']){
  const st=storage(),before=st.snapshot(),session=createTradeExecutionBoundary(st,'isolated-m1460');
  assert.equal(session.review(proposal,'franchise-rev-1',{decision:'accepted'}).status,'awaiting-explicit-GM-decision');
  const result=session.decide(action);
  assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);
  assert.equal(session.decide('approve').code,'review-required');
  assert.equal(st.snapshot(),before);assert.equal(st.writes(),0);
 }
});
test('stale cross-tab revision rejects approval; reload clears pending consent',()=>{
 const st=storage(),session=createTradeExecutionBoundary(st,'isolated-m1460');
 session.review(proposal,'franchise-rev-1',null);
 const next=JSON.parse(st.snapshot());next.meta.currentDate='2028-02-03';
 st.external(JSON.stringify(next));
 assert.equal(session.decide('approve').code,'stale-review');
 session.reload();
 assert.equal(session.decide('approve').code,'review-required');
 assert.equal(st.writes(),0);
});
test('tampered pick ownership, invalid proposal and production key fail closed',()=>{
 const st=storage(),session=createTradeExecutionBoundary(st,'isolated-m1460');
 assert.equal(session.review({outgoingPlayerId:'nonexistent',incomingPlayerId:'cpu-d'},'franchise-rev-1',null).code,'invalid-proposal');
 assert.throws(()=>createTradeExecutionBoundary(st,'hlm_front_office_v8'));
 const state=franchise();state.assets.draftPicks[0].teamId=2;
 const changed=storage(state),guard=createTradeExecutionBoundary(changed,'isolated-m1460');
 const before=changed.snapshot();
 const review=guard.review(proposal,'franchise-rev-1',null);
 assert.equal(review.settlementAuthorized,false);
 assert.equal(guard.decide('approve').saved,false);
 assert.equal(changed.snapshot(),before);assert.equal(changed.writes(),0);
});
