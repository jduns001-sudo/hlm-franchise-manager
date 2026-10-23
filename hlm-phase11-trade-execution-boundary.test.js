'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createTradeExecutionBoundary}=require('./hlm-phase11-trade-execution-boundary');
const {createGameStateEnvelope}=require('./hlm-game-state');
const input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
 return s;
}
function store(){let value=JSON.stringify(fixture()),writes=0;return {getItem:()=>value,setItem:()=>{writes++},external:v=>{value=v},snapshot:()=>value,writes:()=>writes}}
test('GM approval, cancellation and decline never settle or save',()=>{
 for(const action of ['approve','cancel','decline']){
  const s=store(),before=s.snapshot(),session=createTradeExecutionBoundary(s,'isolated-1453');
  const r=session.review(input,'rev1',{decision:'accepted',authorityProof:{signed:true}});
  assert.equal(r.status,'awaiting-explicit-GM-decision');
  const result=session.decide(action);assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);
  assert.equal(s.snapshot(),before);assert.equal(s.writes(),0);
 }
});
test('stale write fails closed and reload clears review',()=>{
 const s=store(),session=createTradeExecutionBoundary(s,'isolated-1453');
 session.review(input,'rev1',null);s.external(s.snapshot()+' ');
 assert.equal(session.decide('approve').code,'stale-review');
 session.reload();assert.equal(session.decide('approve').code,'review-required');assert.equal(s.writes(),0);
});
test('invalid and production keys blocked; no approval without review',()=>{
 const s=store();assert.throws(()=>createTradeExecutionBoundary(s,'hlm_front_office_v8'));
 const session=createTradeExecutionBoundary(s,'isolated-1453');
 assert.equal(session.decide('approve').code,'review-required');
 assert.equal(session.review({outgoingPlayerId:'missing'},'rev1',null).code,'invalid-proposal');
 assert.equal(s.writes(),0);
});
