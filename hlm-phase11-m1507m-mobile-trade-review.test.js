'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createGameStateEnvelope}=require('./hlm-game-state');
const bundle=fs.readFileSync('hlm-phase11-m1507m-mobile-trade-bundle.js','utf8');
const html=fs.readFileSync('hlm-phase11-m1507m-mobile-trade-review.html','utf8');
const office=fs.readFileSync('hlm-phase11-mobile-office.html','utf8');
const key='hlm-phase11-m1340-isolated-single-game-v1';
function fixture(){
 const state=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
 players:[{id:'a',teamId:1,position:'C',overall:85},{id:'b',teamId:2,position:'D',overall:80}],
 contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
 {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
 state.finances.teamCapLimits={1:10,2:10};state.extensions.tradeRosterLimits={1:23,2:23};
 let raw=JSON.stringify(state),writes=0;
 const storage={getItem:k=>k===key?raw:k==='hlm_front_office_v8'?'PRODUCTION_SENTINEL':null,
 setItem:()=>{writes++},external:v=>{raw=v},raw:()=>raw,writes:()=>writes};
 const context={};vm.runInNewContext(bundle,context);
 return {session:context.HLMPhase11MobileTradeReview.create(storage,key),storage};
}
test('mobile bundle reviews real isolated key and never persists any GM decision',()=>{
 for(const decision of ['approve','decline','cancel']){
  const {session,storage}=fixture(),before=storage.raw();
  const result=session.review({outgoingPlayerId:'a',incomingPlayerId:'b'});
  assert.equal(result.status,'awaiting-human-GM-decision');
  assert.equal(result.cpuEvaluation.recommendation,'favorable-for-receiving-team');
  assert.equal(result.cpuEvaluation.authenticatedCpuConsent,false);
  assert.equal(session.decide(decision).saved,false);
  assert.equal(storage.raw(),before);assert.equal(storage.writes(),0);
  assert.equal(storage.getItem('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
 }
});
test('mobile bundle rejects stale save and unsupported source',()=>{
 const {session,storage}=fixture();
 assert.equal(session.review({outgoingPlayerId:'missing',incomingPlayerId:'b'}).code,'invalid-proposal');
 assert.equal(session.review({outgoingPlayerId:'a',incomingPlayerId:'b'}).status,'awaiting-human-GM-decision');
 const s=JSON.parse(storage.raw());s.meta.currentDate='2029-01-01';storage.external(JSON.stringify(s));
 assert.equal(session.decide('approve').code,'stale-save');assert.equal(storage.writes(),0);
});
test('mobile UI provides accessible guarded review actions and isolated Team link',()=>{
 for(const id of ['outgoing','incoming','review','reload','report','approve','decline','cancel'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/hlm-phase11-m1507m-mobile-trade-bundle\.js/);
 assert.match(html,/CPU consent: NOT authenticated/);
 assert.match(html,/Settlement: DISABLED/);
 assert.match(html,/role="status"/);
 assert.match(office,/href="\.\/hlm-phase11-m1507m-mobile-trade-review\.html"/);
 assert.doesNotMatch(html,/setItem\s*\(/);
});
