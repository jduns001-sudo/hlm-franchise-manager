'use strict';
const assert=require('node:assert/strict');
const {buildGMReadiness}=require('./hlm-phase11-gm-readiness');
const state={meta:{controlledTeamId:1,currentDate:'2026-10-14'},activity:{games:[
{id:'g1',date:'2026-10-13',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:4,awayGoals:2},
{id:'g2',date:'2026-10-15',status:'scheduled',homeTeamId:2,awayTeamId:1}
]}};
const original=JSON.stringify(state),result=buildGMReadiness(state);
assert.equal(result.record.gp,1);
assert.equal(result.record.points,2);
assert.equal(result.nextGame.id,'g2');
assert.equal(result.lastGames.length,1);
assert(result.recommendations.every(x=>x.requiresGMApproval&&!x.automaticallyApplied));
assert.equal(result.productionActivationEnabled,false);
assert.equal(JSON.stringify(state),original);
console.log('GM readiness advisory and production isolation regression passed');
