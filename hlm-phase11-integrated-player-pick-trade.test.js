'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {inspect,createSession}=require('./hlm-phase11-integrated-player-pick-trade');
function state(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}],draftPicks:[{id:'p1',year:2028,round:1,originalTeamId:1,teamId:1},{id:'p2',year:2029,round:2,originalTeamId:2,teamId:2}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
 return s;
}
const proposal={outgoingPlayerId:'a',incomingPlayerId:'b',picks:[{pickId:'p1',fromTeamId:1,toTeamId:2},{pickId:'p2',fromTeamId:2,toTeamId:1}]};
function storage(){let raw=JSON.stringify(state()),writes=0;return {getItem:()=>raw,setItem:()=>{writes++},external:v=>{raw=v},snapshot:()=>raw,writes:()=>writes}}
test('integrated player and pick review is sourced and never mutates the game',()=>{
 const s=state(),before=JSON.stringify(s),r=inspect(s,proposal);
 assert.equal(r.status,'integrated-player-pick-review-only');
 assert.deepEqual(r.players,{outgoingPlayerId:'a',incomingPlayerId:'b'});
 assert.equal(r.picks.length,2);assert.equal(r.picks[0].year,2028);
 assert.equal(r.financialReviewed,true);assert.equal(r.restrictionsReviewed,true);
 assert.equal(r.gmApproved,false);assert.equal(r.independentlyAuthenticated,false);
 assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);
 assert.equal(JSON.stringify(s),before);
});
test('composite fails closed on cap, contract, restriction, roster and receiving authority',()=>{
 const cases=[
  s=>s.finances.teamCapLimits[1]=1,
  s=>s.assets.contracts[0].status='expired',
  s=>s.assets.contracts[1].tradePermission='unknown',
  s=>s.extensions.tradeRosterLimits[2]=0,
  s=>s.extensions.tradeDecisionConsents=[]
 ];
 for(const mutate of cases){const s=state();mutate(s);assert.throws(()=>inspect(s,proposal))}
});
test('composite rejects invented, stale, duplicate or misowned draft rights',()=>{
 const cases=[
  [s=>{}, {...proposal,picks:[{pickId:'invented',fromTeamId:1,toTeamId:2}]}],
  [s=>{}, {...proposal,picks:[{pickId:'p1',fromTeamId:2,toTeamId:1}]}],
  [s=>{}, {...proposal,picks:[proposal.picks[0],proposal.picks[0]]}],
  [s=>s.assets.draftPicks.push({...s.assets.draftPicks[0],id:'duplicate'}),proposal]
 ];
 for(const [mutate,input] of cases){const s=state();mutate(s);assert.throws(()=>inspect(s,input))}
});
test('GM decisions never settle or write, and replay is blocked',()=>{
 for(const action of ['approve','decline','cancel']){
  const st=storage(),before=st.snapshot(),session=createSession(st,'isolated-composite');
  assert.equal(session.review(proposal).status,'integrated-player-pick-review-only');
  const result=session.decide(action);
  assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);
  assert.equal(session.decide('approve').code,'review-required');
  assert.equal(st.snapshot(),before);assert.equal(st.writes(),0);
 }
});
test('cross-tab stale save blocks decision, reload clears pending, production key prohibited',()=>{
 const st=storage(),session=createSession(st,'isolated-composite');session.review(proposal);
 const changed=JSON.parse(st.snapshot());changed.assets.draftPicks[0].teamId=2;st.external(JSON.stringify(changed));
 assert.equal(session.decide('approve').code,'stale-review');
 session.reload();assert.equal(session.decide('approve').code,'review-required');
 assert.equal(st.writes(),0);
 assert.throws(()=>createSession(st,'hlm_front_office_v8'));
});
test('review cannot use an empty pick list or proceed after external change',()=>{
 const st=storage(),session=createSession(st,'isolated-composite');
 assert.throws(()=>session.review({...proposal,picks:[]}));
 const before=st.snapshot();st.external(before+' ');
 assert.equal(session.review(proposal).code,'stale-review');
});
