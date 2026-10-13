'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalHighlightPeriodAnalytics}=require('./hlm-experimental-highlight-period-analytics');
const positions=['C','LW','RW','D','D','G'];
const players=[...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))];
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=createExperimentalHighlightPeriodAnalytics(state,1,2,42);
assert.equal(result.kind,'experimental-highlight-period-analytics');
assert.equal(result.official,false);
assert.equal(result.persistencePerformed,false);
assert.deepEqual(createExperimentalHighlightPeriodAnalytics(state,1,2,42),result);
if(result.researchReady){
 assert.equal(result.analytics.scope,'synthetic-highlights-only');
 assert.equal(result.analytics.periods.reduce((n,p)=>n+p.highlightCount,0),result.analytics.totalHighlights);
 assert.deepEqual(result.analytics.periods.map(p=>p.period),[...result.analytics.periods.map(p=>p.period)].sort((a,b)=>a-b));
 for(const p of result.analytics.periods)assert.equal(p.dominantTypes.reduce((n,t)=>n+t.count,0),p.highlightCount);
}else{assert.equal(result.analytics,null);assert(Array.isArray(result.blockers));}
assert.equal(JSON.stringify(state),before);
console.log('Batch 957-964 experimental highlight period analytics tests passed.');
