'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reviewPickTransfer}=require('./hlm-phase11-source-pick-transfer');
const {createGameStateEnvelope}=require('./hlm-game-state');
const sourcePick={pickId:'DP-0-2028-1-1-1',league:0,year:2028,round:1,originalTeamId:1,currentOwnerId:5,status:'AVAILABLE',source:'hlm-universe.json'};
const make=()=>createGameStateEnvelope({teams:[{id:1,name:'New Jersey'},{id:5,name:'Pittsburgh'}],draftPicks:[sourcePick]});
test('review changes only proposed state; original franchise remains untouched until separate GM approval',()=>{
 const state=make(),before=JSON.stringify(state);
 const {nextState,review}=reviewPickTransfer(state,{pickId:sourcePick.pickId,fromTeamId:5,toTeamId:1});
 assert.equal(JSON.stringify(state),before);assert.equal(nextState.assets.draftPicks[0].currentOwnerId,1);
 assert.equal(review.requiresGmApproval,true);assert.equal(nextState.assets.contracts.length,0);assert.equal(nextState.universe.prospects.length,0);
});
test('unknown pick, wrong owner, unknown recipient, same owner and used pick reject atomically',()=>{
 const state=make(),before=JSON.stringify(state);
 for(const input of [
 {pickId:'nonexistent',fromTeamId:5,toTeamId:1},
 {pickId:sourcePick.pickId,fromTeamId:1,toTeamId:5},
 {pickId:sourcePick.pickId,fromTeamId:5,toTeamId:27},
 {pickId:sourcePick.pickId,fromTeamId:5,toTeamId:5}
 ])assert.throws(()=>reviewPickTransfer(state,input));
 const used=make();used.assets.draftPicks[0].status='used';
 assert.throws(()=>reviewPickTransfer(used,{pickId:sourcePick.pickId,fromTeamId:5,toTeamId:1}));
 assert.equal(JSON.stringify(state),before);
});
test('duplicate pick identity and unsupported provenance cannot be transferred',()=>{
 const state=make();state.assets.draftPicks.push({...sourcePick});
 assert.throws(()=>reviewPickTransfer(state,{pickId:sourcePick.pickId,fromTeamId:5,toTeamId:1}));
 const foreign=make();foreign.assets.draftPicks[0].source='unverified';
 assert.throws(()=>reviewPickTransfer(foreign,{pickId:sourcePick.pickId,fromTeamId:5,toTeamId:1}));
});
