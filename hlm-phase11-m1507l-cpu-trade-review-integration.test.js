'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {create}=require('./hlm-phase11-m1507j-guarded-trade-workflow');
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
 players:[{id:'a',teamId:1,position:'C',overall:85},{id:'b',teamId:2,position:'D',overall:80}],
 contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
 {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 let raw=JSON.stringify(s),writes=0;
 const storage={getItem:k=>k==='hlm-phase11-test'?raw:k==='hlm_front_office_v8'?'SENTINEL':null,
 setItem:()=>{writes++},external:v=>{raw=v},raw:()=>raw,writes:()=>writes};
 return {storage,session:create(storage,'hlm-phase11-test')};
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b'};
test('GM review includes CPU valuation but no consent or save on any decision',()=>{
 for(const decision of ['approve','decline','cancel']){
  const {session,storage}=fixture(),before=storage.raw();
  const review=session.review(input);
  assert.equal(review.status,'awaiting-human-GM-decision');
  assert.equal(review.cpuEvaluation.status,'cpu-trade-evaluation-preview');
  assert.equal(review.cpuEvaluation.recommendation,'favorable-for-receiving-team');
  assert.equal(review.cpuEvaluation.authenticatedCpuConsent,false);
  assert.equal(review.cpuEvaluation.settlementAuthorized,false);
  assert.equal(session.decide(decision).saved,false);
  assert.equal(storage.raw(),before);assert.equal(storage.writes(),0);
  assert.equal(storage.getItem('hlm_front_office_v8'),'SENTINEL');
 }
});
test('missing source valuation is explicit and cannot authorize settlement',()=>{
 const {session,storage}=fixture(),s=JSON.parse(storage.raw());
 delete s.universe.players[0].overall;storage.external(JSON.stringify(s));session.reload();
 const review=session.review(input);
 assert.equal(review.status,'awaiting-human-GM-decision');
 assert.equal(review.cpuEvaluation.status,'cpu-trade-evaluation-blocked');
 assert.equal(review.cpuEvaluation.authenticatedCpuConsent,false);
 assert.equal(session.decide('approve').settlementAuthorized,false);
 assert.equal(storage.writes(),0);
});
test('stale review invalidates valuation and blocks decisions',()=>{
 const {session,storage}=fixture();
 const review=session.review({...input,receivingTeamConsent:true,gmApproved:true});
 assert.equal(review.cpuEvaluation.authenticatedCpuConsent,false);
 const s=JSON.parse(storage.raw());s.meta.currentDate='2028-01-01';storage.external(JSON.stringify(s));
 assert.equal(session.decide('approve').code,'stale-save');
 assert.equal(storage.writes(),0);
});
