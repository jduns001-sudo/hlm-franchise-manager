'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createTradeReview}=require('./hlm-phase11-gm-trade-review');
const KEY='hlm-phase11-m1340-isolated-single-game-v1',PROD='hlm_front_office_v8';
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
function makeStore(){
 const map=new Map([[KEY,JSON.stringify(fixture())],[PROD,'PRODUCTION_SENTINEL']]);
 const writes=[];return {getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push(k);map.set(k,v)},map,writes};
}
test('GM can review authoritative consent and approve review without saving or settlement',()=>{
 const s=makeStore(),before=s.getItem(KEY),gm=createTradeReview(s,KEY);
 assert.equal(gm.review(input).decision.consentVerified,true);
 assert.deepEqual(gm.decide('approve-review'),{status:'GM-review-approved',receivingTeamConsentVerified:true,saved:false,settlementAuthorized:false,reason:'Atomic trade settlement remains disabled'});
 assert.equal(s.getItem(KEY),before);assert.equal(s.getItem(PROD),'PRODUCTION_SENTINEL');assert.deepEqual(s.writes,[]);
 assert.throws(()=>gm.decide('approve-review'),/review required/);
});
test('decline and cancel discard pending review and preserve multiseason history',()=>{
 const s=makeStore(),before=s.getItem(KEY),gm=createTradeReview(s,KEY);
 gm.review(input);assert.equal(gm.decide('decline').saved,false);
 gm.review(input);assert.equal(gm.decide('cancel').status,'cancelled');
 assert.deepEqual(gm.reload().history.seasons,[{year:2034,champion:1}]);
 assert.equal(s.getItem(KEY),before);assert.deepEqual(s.writes,[]);
});
test('stale save blocks approval and requires reload',()=>{
 const s=makeStore(),gm=createTradeReview(s,KEY);gm.review(input);
 const newer=fixture();newer.meta.currentDate='2035-03-01';s.setItem(KEY,JSON.stringify(newer));
 assert.throws(()=>gm.decide('approve-review'),/Stale/);
 assert.throws(()=>gm.decide('approve-review'),/Stale/);
 assert.equal(s.getItem(PROD),'PRODUCTION_SENTINEL');
 gm.reload();assert.equal(gm.review(input).settlementAuthorized,false);
});
test('caller consent does not override denied source, and production key rejected without access',()=>{
 const s=makeStore(),gm=createTradeReview(s,KEY);
 const denied=fixture();denied.extensions.tradeDecisionConsents[0].decision='declined';
 s.setItem(KEY,JSON.stringify(denied));gm.reload();
 assert.throws(()=>gm.review(input),/consent/);
 let reads=0,writes=0;
 assert.throws(()=>createTradeReview({getItem(){reads++},setItem(){writes++}},PROD),/isolated/);
 assert.equal(reads,0);assert.equal(writes,0);
});
