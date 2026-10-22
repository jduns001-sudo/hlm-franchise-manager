'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {reviewReciprocalPickExchange:review}=require('./hlm-phase11-reciprocal-pick-exchange');
const picks=[{pickId:'DP-A',year:2028,round:1,originalTeamId:1,currentOwnerId:1,status:'AVAILABLE',source:'hlm-universe.json'},{pickId:'DP-B',year:2029,round:2,originalTeamId:5,currentOwnerId:5,status:'AVAILABLE',source:'hlm-universe.json'}];
function fixture(){const state=createGameStateEnvelope({teams:[{id:1,name:'New Jersey'},{id:5,name:'Pittsburgh'}],draftPicks:picks});state.meta.controlledTeamId=1;return state}
const args={controlledTeamId:1,otherTeamId:5,controlledPickId:'DP-A',otherPickId:'DP-B'};
test('reciprocal proposal changes exactly two ownership fields and never writes input',()=>{const state=fixture(),before=JSON.stringify(state);const {nextState,review:summary}=review(state,args);assert.equal(JSON.stringify(state),before);assert.equal(nextState.assets.draftPicks[0].currentOwnerId,5);assert.equal(nextState.assets.draftPicks[1].currentOwnerId,1);assert.equal(summary.requiresGmApproval,true);assert.equal(summary.officialTrade,false);assert.deepEqual(nextState.assets.contracts,state.assets.contracts)});
test('wrong owner, duplicate, used, invented source and noncontrolled team fail atomically',()=>{for(const change of [s=>s.assets.draftPicks[0].currentOwnerId=5,s=>s.assets.draftPicks.push({...s.assets.draftPicks[0]}),s=>s.assets.draftPicks[1].status='USED',s=>s.assets.draftPicks[1].source='unknown',s=>s.meta.controlledTeamId=5]){const s=fixture();change(s);const before=JSON.stringify(s);assert.throws(()=>review(s,args));assert.equal(JSON.stringify(s),before)}});
test('missing or identical picks and teams rejected',()=>{for(const a of [{...args,otherPickId:'missing'},{...args,otherPickId:'DP-A'},{...args,otherTeamId:1},{...args,controlledPickId:null}])assert.throws(()=>review(fixture(),a))});
