'use strict';
const assert=require('node:assert/strict');
const {createPlayoffBracket,recordBracketGame}=require('./hlm-phase10-playoff-bracket');
const seeds=[1,2,3,4,5,6,7,8].map(seed=>({seed,teamId:seed}));
let bracket=createPlayoffBracket(seeds,7);
assert.equal(bracket.rounds[0].length,4);
const original=JSON.stringify(bracket);
let id=0;
while(bracket.status==='active'){
 const round=bracket.rounds[bracket.rounds.length-1];
 for(let i=0;i<round.length;i++){
  while(bracket.rounds[bracket.rounds.length-1][i]?.status==='active'){
   const series=bracket.rounds[bracket.rounds.length-1][i];
   const high=series.highSeed.teamId,low=series.lowSeed.teamId;
   bracket=recordBracketGame(bracket,i,{gameId:'G'+(++id),homeTeamId:high,awayTeamId:low,winnerTeamId:high,status:'final',homeGoals:3,awayGoals:1});
  }
 }
}
assert.equal(bracket.rounds.length,3);
assert.equal(bracket.championTeamId,1);
assert.equal(bracket.status,'complete');
assert.match(original,/"active"/);
assert.throws(()=>recordBracketGame(bracket,0,{}),/complete/);
assert.throws(()=>createPlayoffBracket(seeds.slice(0,3)),/power of two/);
assert.throws(()=>createPlayoffBracket([{seed:1,teamId:1},{seed:2,teamId:1}]),/unique/);
console.log('Phase 10 playoff bracket tests passed');
