'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalHighlightMomentum}=require('./hlm-experimental-highlight-momentum');
const positions=['C','LW','RW','D','D','G'];
const players=[...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))];
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=createExperimentalHighlightMomentum(state,1,2,42);
assert.equal(result.kind,'experimental-highlight-momentum');
assert.equal(result.official,false);
assert.equal(result.persistencePerformed,false);
assert.deepEqual(createExperimentalHighlightMomentum(state,1,2,42),result);
if(result.researchReady){
 assert.equal(result.momentum.scope,'synthetic-highlight-frequency-only');
 assert.equal(result.momentum.trend.reduce((n,p)=>n+p.highlightCount,0),result.momentum.totalHighlights);
 for(let i=0;i<result.momentum.trend.length;i++){
  const p=result.momentum.trend[i];
  if(i===0){assert.equal(p.direction,'baseline');assert.equal(p.deltaFromPriorPeriod,null);}
  else{const delta=p.highlightCount-result.momentum.trend[i-1].highlightCount;assert.equal(p.deltaFromPriorPeriod,delta);assert.equal(p.direction,delta>0?'rising':delta<0?'falling':'steady');}
 }
}else{assert.equal(result.momentum,null);assert(Array.isArray(result.blockers));}
assert.equal(JSON.stringify(state),before);
console.log('Batch 965-972 synthetic highlight momentum tests passed.');
