'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalHighlightEvidenceReport}=require('./hlm-experimental-highlight-evidence-report');
const positions=['C','LW','RW','D','D','G'];
const players=[...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))];
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=createExperimentalHighlightEvidenceReport(state,1,2,42);
assert.equal(result.kind,'experimental-highlight-evidence-report');
assert.equal(result.official,false);
assert.equal(result.persistencePerformed,false);
assert.deepEqual(createExperimentalHighlightEvidenceReport(state,1,2,42),result);
if(result.researchReady){
 assert.equal(result.report.verified,true);
 assert.equal(result.report.scope,'synthetic-highlights-only');
 assert.equal(result.report.periods.length,result.report.periodsChecked);
 assert.equal(result.report.periods.reduce((n,p)=>n+p.highlights,0),result.report.highlightsChecked);
}else{assert.equal(result.report,null);assert(Array.isArray(result.blockers));}
assert.equal(JSON.stringify(state),before);
console.log('Batch 941-948 experimental highlight evidence report tests passed.');
