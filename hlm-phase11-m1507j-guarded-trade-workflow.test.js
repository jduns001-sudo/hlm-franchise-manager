'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {create}=require('./hlm-phase11-m1507j-guarded-trade-workflow');
const input={outgoingPlayerId:'a',incomingPlayerId:'b'};
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
  players:[{id:'a',teamId:1,position:'C'},{id:'b',teamId:2,position:'D'}],
  contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
   {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 let data=JSON.stringify(s),writes=0;
 const storage={getItem:k=>k==='hlm-phase11-test'?data:k==='hlm_front_office_v8'?'PRODUCTION_SENTINEL':null,
  setItem:()=>{writes++},external:v=>{data=v},snapshot:()=>data,writes:()=>writes};
 return {storage,session:create(storage,'hlm-phase11-test')};
}
test('review, approve, decline and cancel never save or grant settlement',()=>{
 for(const action of ['approve','decline','cancel']){
  const {storage,session}=fixture(),before=storage.snapshot();
  const review=session.review(input);
  assert.equal(review.status,'awaiting-human-GM-decision');
  assert.equal(review.saved,false);
  const result=session.decide(action);
  assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);
  assert.equal(session.decide('approve').code,'review-required');
  assert.equal(storage.snapshot(),before);assert.equal(storage.writes(),0);
  assert.equal(storage.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
 }
});
test('stale cross-tab changes invalidate pending review; reload clears decision',()=>{
 const {storage,session}=fixture();
 session.review(input);
 const changed=JSON.parse(storage.snapshot());changed.meta.currentDate='2027-01-01';
 storage.external(JSON.stringify(changed));
 assert.equal(session.decide('approve').code,'stale-save');
 assert.equal(session.review(input).code,'stale-save');
 session.reload();
 assert.equal(session.decide('approve').code,'review-required');
 assert.equal(storage.writes(),0);
});
test('invalid source proposal, production key and caller consent flags fail closed',()=>{
 const {storage,session}=fixture(),before=storage.snapshot();
 assert.equal(session.review({outgoingPlayerId:'missing',incomingPlayerId:'b'}).code,'invalid-proposal');
 assert.equal(session.decide('approve').code,'review-required');
 assert.throws(()=>create(storage,'hlm_front_office_v8'));
 assert.throws(()=>create(storage,'arbitrary-key'));
 assert.equal(session.review({...input,receivingTeamConsent:true,gmApproved:true}).status,'awaiting-human-GM-decision');
 assert.equal(session.decide('approve').settlementAuthorized,false);
 assert.equal(storage.snapshot(),before);assert.equal(storage.writes(),0);
});
