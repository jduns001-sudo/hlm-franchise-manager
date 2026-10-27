'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {teams,build}=require('./hlm-phase11-new-franchise');
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-schedule')};
const {inspectAssetTransaction}=require('./hlm-phase11-block-a-asset-transaction-gate');
test('real-universe player and pick proposal cannot bypass missing contracts or CPU consent',()=>{
 const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
 const team=teams(source).find(t=>t.abbr==='PIT');
 const state=build(source,team.id,engine);
 const player=state.universe.players.find(p=>String(p.teamId)===String(team.id));
 const pick=state.assets.draftPicks.find(p=>p.status==='AVAILABLE');
 assert.ok(player&&pick);
 const other=teams(source).find(t=>String(t.id)!==String(team.id)&&String(t.id)!==String(pick.currentOwnerId)).id;
 const before=JSON.stringify(state);
 const result=inspectAssetTransaction(source,state,{players:[{playerId:player.id,fromTeamId:team.id,toTeamId:other}],picks:[{pickId:pick.pickId,fromTeamId:pick.currentOwnerId,toTeamId:other}],prospects:[],gmApproved:true,cpuApproved:true});
 assert.equal(result.status,'blocked-pending-independent-authorization');
 assert.ok(result.issues.some(i=>i.code==='contract-identity-unverified'));
 assert.ok(result.issues.some(i=>i.code==='independent-cpu-consent-required'));
 assert.equal(result.gmApproved,false);
 assert.equal(result.cpuConsentAuthenticated,false);
 assert.equal(result.saved,false);
 assert.equal(JSON.stringify(state),before);
});
test('invalid or empty proposal cannot authorize settlement',()=>{
 const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
 const team=teams(source)[0],state=build(source,team.id,engine);
 const result=inspectAssetTransaction(source,state,{players:[],picks:[],prospects:[]});
 assert.ok(result.issues.some(i=>i.code==='empty-transaction'));
 assert.equal(result.settlementAuthorized,false);
});

test('isolated GM review never writes on approve, decline, cancel or stale tab',()=>{
 const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
 const state=build(source,teams(source)[0].id,engine);
 const key='phase11-block-a-test-only',initial=JSON.stringify(state);
 let value=initial,writes=0;
 const storage={getItem(k){assert.equal(k,key);return value},setItem(){writes++;throw Error('Write forbidden')}};
 const {createAssetReviewSession}=require('./hlm-phase11-block-a-asset-transaction-gate');
 const session=createAssetReviewSession(source,storage,key),proposal={players:[],picks:[],prospects:[]};
 for(const action of ['cancel','decline','approve']){
  session.review(proposal);
  const result=session.decide(action);
  assert.equal(result.saved,false);
  assert.equal(result.settlementAuthorized,false);
  assert.equal(value,initial);
 }
 session.review(proposal);
 value=initial+' ';
 assert.equal(session.decide('approve').code,'stale-review');
 assert.equal(writes,0);
 assert.equal(session.reload().meta.controlledTeamId,state.meta.controlledTeamId);
 assert.equal(writes,0);
});
