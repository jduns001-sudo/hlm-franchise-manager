'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {inspect,createSession}=require('./hlm-phase11-draft-pick-trade-readiness');
function state(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}],draftPicks:[{id:'p1',year:2028,round:1,originalTeamId:1,teamId:1},{id:'p2',year:2029,round:2,originalTeamId:2,teamId:2}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];return s;
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',picks:[{pickId:'p1',fromTeamId:1,toTeamId:2},{pickId:'p2',fromTeamId:2,toTeamId:1}]};
function store(){let data=JSON.stringify(state()),writes=0;return {getItem:()=>data,setItem:()=>{writes++},external:x=>data=x,snapshot:()=>data,writes:()=>writes}}
test('source-backed two-way pick proposal reviews real year, round and current owner without mutation',()=>{
 const s=state(),before=JSON.stringify(s),r=inspect(s,input);
 assert.equal(r.picks.length,2);assert.equal(r.picks[0].year,2028);assert.equal(r.picks[1].currentOwner,'2');
 assert.equal(r.financialReviewed,true);assert.equal(r.restrictionsReviewed,true);
 assert.equal(r.settlementAuthorized,false);assert.equal(r.saved,false);assert.equal(JSON.stringify(s),before);
});
test('reject wrong owner, missing, duplicate, ambiguous underlying right, invalid round and original team',()=>{
 const cases=[
  [s=>{}, {...input,picks:[{pickId:'p1',fromTeamId:2,toTeamId:1}]}],
  [s=>{}, {...input,picks:[{pickId:'missing',fromTeamId:1,toTeamId:2}]}],
  [s=>{}, {...input,picks:[input.picks[0],input.picks[0]]}],
  [s=>s.assets.draftPicks.push({...s.assets.draftPicks[0],id:'p3'}),input],
  [s=>s.assets.draftPicks[0].round=0,input],
  [s=>s.assets.draftPicks[0].originalTeamId=99,input]
 ];
 for(const [mutate,proposal] of cases){const s=state();mutate(s);assert.throws(()=>inspect(s,proposal))}
});
test('GM approve, decline and cancel never write or transfer picks; replay blocked',()=>{
 for(const action of ['approve','decline','cancel']){const st=store(),before=st.snapshot(),session=createSession(st,'isolated-picks');
  assert.equal(session.review(input).status,'draft-pick-trade-review-only');
  const result=session.decide(action);assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);
  assert.equal(session.decide('approve').code,'review-required');assert.equal(st.writes(),0);assert.equal(st.snapshot(),before);
 }
});
test('stale cross-tab save rejects; reload clears pending; production key prohibited',()=>{
 const st=store(),session=createSession(st,'isolated-picks');session.review(input);
 const updated=JSON.parse(st.snapshot());updated.assets.draftPicks[0].teamId=2;st.external(JSON.stringify(updated));
 assert.equal(session.decide('approve').code,'stale-review');
 session.reload();assert.equal(session.decide('approve').code,'review-required');assert.equal(st.writes(),0);
 assert.throws(()=>createSession(st,'hlm_front_office_v8'));
});
