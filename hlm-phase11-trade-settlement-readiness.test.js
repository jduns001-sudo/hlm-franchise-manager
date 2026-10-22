'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {inspect,createReadinessSession}=require('./hlm-phase11-trade-settlement-readiness');
const key='hlm-phase11-m1340-isolated-single-game-v1',prod='hlm_front_office_v8';
const input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],
  players:[{id:'a',teamId:1},{id:'b',teamId:2}],
  contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},
   {playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
 s.history.seasons=[{year:2034,champion:1}];return s;
}
function store(){const map=new Map([[key,JSON.stringify(fixture())],[prod,'PRODUCTION_SENTINEL']]),writes=[];
 return {getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push(k);map.set(k,v)},writes,map};}
test('receiving-team source claim is surfaced honestly and settlement always blocked',()=>{
 const s=fixture(),before=JSON.stringify(s),x=inspect(s,input);
 assert.equal(x.receivingTeamDecision,'accepted');assert.equal(x.receivingTeam.independentlyAuthenticated,false);
 assert.equal(x.atomicSettlementVerified,false);assert.equal(x.settlementAuthorized,false);
 assert.equal(x.saved,false);assert.equal(JSON.stringify(s),before);
});
test('GM review approval, decline and cancel never write or transfer players',()=>{
 const s=store(),before=s.getItem(key),session=createReadinessSession(s,key);
 assert.equal(session.review(input).settlementAuthorized,false);
 const x=session.decide('approve-review');assert.equal(x.status,'GM-review-approved');
 assert.equal(x.readiness.settlementAuthorized,false);
 session.review(input);assert.equal(session.decide('decline').saved,false);
 session.review(input);assert.equal(session.decide('cancel').saved,false);
 assert.equal(s.getItem(key),before);assert.equal(s.getItem(prod),'PRODUCTION_SENTINEL');assert.deepEqual(s.writes,[]);
 assert.deepEqual(session.reload().history.seasons,[{year:2034,champion:1}]);
});
test('declined, absent, duplicated, wrong-team or caller-only consent cannot pass',()=>{
 for(const change of [s=>s.extensions.tradeDecisionConsents[0].decision='declined',
  s=>delete s.extensions.tradeDecisionConsents,
  s=>s.extensions.tradeDecisionConsents.push({...s.extensions.tradeDecisionConsents[0]}),
  s=>s.extensions.tradeDecisionConsents[0].receivingTeamId=1,
  s=>s.extensions.tradeDecisionConsents[0].source='caller']){
  const s=fixture();change(s);assert.throws(()=>inspect(s,input),/consent/);
 }
});
test('financial, roster and contract uncertainty block readiness',()=>{
 const a=fixture();a.finances.teamCapLimits[1]=4;assert.throws(()=>inspect(a,input),/salary cap/);
 const b=fixture();b.assets.contracts[0].tradePermission='unknown';assert.throws(()=>inspect(b,input),/permission/);
 const c=fixture();delete c.extensions.tradeRosterLimits;assert.throws(()=>inspect(c,input),/roster limits/);
});
test('stale review cannot approve and requires reload; production key rejected',()=>{
 const s=store(),session=createReadinessSession(s,key);session.review(input);
 const newer=fixture();newer.meta.currentDate='2035-04-01';s.setItem(key,JSON.stringify(newer));
 assert.throws(()=>session.decide('approve-review'),/Stale/);
 assert.equal(s.getItem(prod),'PRODUCTION_SENTINEL');
 session.reload();assert.equal(session.review(input).saved,false);
 let reads=0,writes=0;
 assert.throws(()=>createReadinessSession({getItem(){reads++},setItem(){writes++}},prod),/isolated/);
 assert.equal(reads,0);assert.equal(writes,0);
});
