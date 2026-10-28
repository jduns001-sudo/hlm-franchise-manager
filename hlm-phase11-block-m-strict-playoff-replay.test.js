'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {createPlayoffBracket,recordBracketGame}=require('./hlm-phase10-playoff-bracket');
const {replayChampionshipBracket:replay}=require('./hlm-phase11-block-m-strict-playoff-replay');
function finished(){
 let bracket=createPlayoffBracket([{seed:1,teamId:'A'},{seed:2,teamId:'B'}],1);
 return recordBracketGame(bracket,0,{gameId:'P1',status:'final',homeTeamId:'A',awayTeamId:'B',winnerTeamId:'A'});
}
test('replays complete Phase 10 bracket exactly',()=>{let b=finished();assert.equal(replay(b).verified,true);assert.equal(replay(b).championTeamId,'A')});
test('rejects champion forgery, extra games and fabricated wins',()=>{
 const b=finished();
 for(const altered of [
  {...b,championTeamId:'B'},
  {...b,rounds:[[{...b.rounds[0][0],wins:{A:9,B:0}}]]},
  {...b,rounds:[[{...b.rounds[0][0],games:[...b.rounds[0][0].games,b.rounds[0][0].games[0]]}]]}
 ])assert.equal(replay(altered).verified,false);
});
test('replay does not turn unfinished playoffs into a champion',()=>{
 const b=createPlayoffBracket([{seed:1,teamId:'A'},{seed:2,teamId:'B'}],7);
 assert.equal(replay(b).verified,false);
});
