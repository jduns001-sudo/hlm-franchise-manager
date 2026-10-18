'use strict';const assert=require('node:assert/strict');const {standings,continuity}=require('./hlm-phase11-season-ledger');
const state={meta:{controlledTeamId:1},universe:{teams:[{id:1,name:'A'},{id:2,name:'B'},{id:3,name:'C'}],players:[{id:11,teamId:1},{id:12,teamId:2}]},activity:{games:[{id:'a',homeTeamId:1,awayTeamId:2,status:'final',homeGoals:3,awayGoals:2,overtime:true},{id:'b',homeTeamId:3,awayTeamId:1,status:'final',homeGoals:0,awayGoals:2,overtime:false}]}};
const table=standings(state);assert.equal(table[0].teamId,1);assert.equal(table[0].pts,4);assert.equal(table.find(t=>t.teamId===2).otl,1);assert.equal(table.find(t=>t.teamId===2).pts,1);assert.equal(table.find(t=>t.teamId===3).l,1);assert.equal(continuity(state,structuredClone(state)).rosterUnchanged,true);
const changed=structuredClone(state);changed.universe.players[0].teamId=2;assert.throws(()=>continuity(state,changed),/Roster continuity/);
const bad=structuredClone(state);bad.activity.games[0].awayGoals=3;assert.throws(()=>standings(bad),/Invalid completed/);
console.log('NHL-style season ledger standings and roster continuity passed');
