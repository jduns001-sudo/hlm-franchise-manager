'use strict';
// Pure, strict Phase 10 bracket replay. Does not authenticate game provenance or approve archival.
const {createPlayoffBracket,recordBracketGame}=require('./hlm-phase10-playoff-bracket');
function replayChampionshipBracket(bracket){
 const fail=reason=>({verified:false,reason,championTeamId:null});
 if(!bracket||bracket.status!=='complete'||bracket.championTeamId==null||!Array.isArray(bracket.rounds)||!bracket.rounds.length)
  return fail('incomplete-bracket');
 try{
  const seeds=bracket.rounds[0].flatMap(s=>[s.highSeed,s.lowSeed]);
  let current=createPlayoffBracket(seeds,bracket.bestOf);
  for(let r=0;r<bracket.rounds.length;r++){
   const expected=current.rounds[r];
   const stored=bracket.rounds[r];
   if(!expected||expected.length!==stored.length)throw Error('round-count-mismatch');
   for(let i=0;i<stored.length;i++){
    if(!Array.isArray(stored[i].games))throw Error('games-missing');
    for(const game of stored[i].games){
     if(current.status!=='active'||current.rounds.length!==r+1)throw Error('extra-game');
     current=recordBracketGame(current,i,game);
    }
   }
  }
  if(JSON.stringify(current)!==JSON.stringify(bracket))throw Error('bracket-state-mismatch');
  return {verified:true,championTeamId:current.championTeamId,reason:'bracket-replay-consistent'};
 }catch(error){return fail('invalid-bracket-replay');}
}
module.exports={replayChampionshipBracket};
