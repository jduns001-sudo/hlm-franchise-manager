'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluate,createDecisionSession}=require('./hlm-phase11-isolated-trade-decision');
const KEY='hlm-phase11-m1340-isolated-single-game-v1';
const input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],
 players:[{id:'a',teamId:1},{id:'b',teamId:2}],
 contracts:[{id:'c1',playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},
 {id:'c2',playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};
 s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
 s.history={seasons:[{year:2034,champion:1}]};
 return s;
}
function storage(s=fixture()){
 const map=new Map([[KEY,JSON.stringify(s)],['hlm_front_office_v8','PRODUCTION_SENTINEL']]);
 return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),snapshot:()=>Array.from(map.entries())};
}
test('verified proposal, financial rules, restrictions and saved receiving-team consent permit review only',()=>{
 const s=fixture(),before=JSON.stringify(s),decision=evaluate(s,input);
 assert.equal(decision.eligibleForFurtherReview,true);
 assert.equal(decision.settlementAuthorized,false);
 assert.equal(decision.consentVerified,true);
 assert.equal(decision.financial.settlementAuthorized,false);
 assert.equal(decision.restrictions.settlementAuthorized,false);
 assert.equal(JSON.stringify(s),before);
});
test('caller-supplied consent cannot replace missing, denied, duplicated or wrong-team source',()=>{
 for(const mutate of [s=>delete s.extensions.tradeDecisionConsents,
 s=>s.extensions.tradeDecisionConsents[0].decision='declined',
 s=>s.extensions.tradeDecisionConsents.push({...s.extensions.tradeDecisionConsents[0]}),
 s=>s.extensions.tradeDecisionConsents[0].receivingTeamId=1,
 s=>s.extensions.tradeDecisionConsents[0].source='caller']){
  const s=fixture();mutate(s);assert.throws(()=>evaluate(s,input),/consent/);
 }
});
test('financial and roster rule failures block decision',()=>{
 const s=fixture();s.finances.teamCapLimits[1]=4;assert.throws(()=>evaluate(s,input),/salary cap/);
 const t=fixture();t.assets.contracts[0].tradePermission='unknown';assert.throws(()=>evaluate(t,input),/permission/);
});
test('human GM decline, blocked approval, reload and multiseason save remain unchanged',()=>{
 const s=storage(),before=s.snapshot(),session=createDecisionSession(s,KEY);
 assert.equal(session.propose(input).settlementAuthorized,false);
 assert.throws(()=>session.approve(false),/approval/);
 assert.throws(()=>session.approve(true),/Review trade first|settlement disabled/);
 assert.deepEqual(s.snapshot(),before);
 session.propose(input);assert.throws(()=>session.approve(true),/settlement disabled/);
 assert.deepEqual(session.reload().history.seasons,[{year:2034,champion:1}]);
 assert.deepEqual(s.snapshot(),before);
});
test('stale isolated save blocks approval without touching production',()=>{
 const s=storage(),session=createDecisionSession(s,KEY);
 session.propose(input);
 const changed=fixture();changed.meta.season=2036;s.setItem(KEY,JSON.stringify(changed));
 assert.throws(()=>session.approve(true),/Stale/);
 assert.equal(s.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
 assert.equal(s.getItem(KEY),JSON.stringify(changed));
});
test('production storage key rejected before reading or writing',()=>{
 let reads=0,writes=0;
 assert.throws(()=>createDecisionSession({getItem(){reads++;},setItem(){writes++;}},'hlm_front_office_v8'),/isolated/);
 assert.equal(reads,0);assert.equal(writes,0);
});
