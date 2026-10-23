'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createWorkspace}=require('./hlm-phase11-integrated-trade-workspace');
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',name:'Alpha',teamId:1},{id:'b',name:'Bravo',teamId:2}],contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}],draftPicks:[{id:'p1',year:2028,round:1,originalTeamId:1,teamId:1}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];return s;
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',picks:[{pickId:'p1',fromTeamId:1,toTeamId:2}]};
function store(){let raw=JSON.stringify(fixture()),writes=0;return {getItem:()=>raw,setItem:()=>{writes++},change:v=>raw=v,raw:()=>raw,writes:()=>writes}}
test('workspace displays sourced players, contracts, rights without writing',()=>{
 const st=store(),before=st.raw(),w=createWorkspace(st,'isolated-1463'),r=w.review(input);
 assert.equal(r.outgoing.name,'Alpha');assert.equal(r.incoming.aav,5);assert.equal(r.picks[0].year,2028);
 assert.equal(r.independentlyAuthenticated,false);assert.equal(r.settlementAuthorized,false);
 assert.equal(w.decide('approve').code,'settlement-disabled');
 assert.equal(st.writes(),0);assert.equal(st.raw(),before);assert.equal(w.decide('approve').code,'review-required');
});
test('decline and cancel never save, and reload clears pending',()=>{
 for(const action of ['decline','cancel']){const st=store(),w=createWorkspace(st,'isolated-1463');w.review(input);assert.equal(w.decide(action).code,action);assert.equal(st.writes(),0)}
 const st=store(),w=createWorkspace(st,'isolated-1463');w.review(input);w.reload();assert.equal(w.decide('approve').code,'review-required');
});
test('stale cross-tab, invalid cap and invented rights fail closed',()=>{
 const st=store(),w=createWorkspace(st,'isolated-1463');w.review(input);st.change(st.raw()+' ');assert.equal(w.decide('approve').code,'stale-review');assert.equal(st.writes(),0);
 const cap=store(),s=JSON.parse(cap.raw());s.finances.teamCapLimits[1]=1;cap.change(JSON.stringify(s));assert.throws(()=>createWorkspace(cap,'isolated-1463').review(input));
 const rights=store();assert.throws(()=>createWorkspace(rights,'isolated-1463').review({...input,picks:[{pickId:'fake',fromTeamId:1,toTeamId:2}]}));
 assert.throws(()=>createWorkspace(store(),'hlm_front_office_v8'));
});
