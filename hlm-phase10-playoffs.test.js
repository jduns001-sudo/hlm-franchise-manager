'use strict';
const assert=require('node:assert/strict');
const {seedPlayoffs,createPlayoffSeries,recordPlayoffGame}=require('./hlm-phase10-playoffs');
const field=seedPlayoffs([{teamId:3,points:10,w:5,gf:12,ga:8},{teamId:1,points:20,w:9,gf:20,ga:7},{teamId:2,points:16,w:7,gf:18,ga:10},{teamId:4,points:8,w:3,gf:9,ga:13}],4);
assert.deepEqual(field.map(x=>x.teamId),[1,2,3,4]);
let series=createPlayoffSeries(field[0],field[3]);
assert.equal(series.bestOf,7);
const original=JSON.stringify(series);
for(let n=1;n<=4;n++){
 series=recordPlayoffGame(series,{gameId:'P'+n,homeTeamId:1,awayTeamId:4,winnerTeamId:1,status:'final',homeGoals:3,awayGoals:1});
 assert.equal(series.games.length,n);
}
assert.equal(series.status,'complete');
assert.equal(series.winnerTeamId,1);
assert.throws(()=>recordPlayoffGame(series,{gameId:'P5',homeTeamId:1,awayTeamId:4,winnerTeamId:1,status:'final'}),/not active/);
assert.match(original,/"active"/);
let other=createPlayoffSeries(field[1],field[2]);
other=recordPlayoffGame(other,{gameId:'X',homeTeamId:2,awayTeamId:3,winnerTeamId:3,status:'final'});
assert.throws(()=>recordPlayoffGame(other,{gameId:'X',homeTeamId:2,awayTeamId:3,winnerTeamId:2,status:'final'}),/Duplicate/);
assert.throws(()=>seedPlayoffs(field,3),/field size/);
console.log('Phase 10 playoff series tests passed');
