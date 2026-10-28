'use strict';
// Read-only validation of SQLite-stored playoff evidence against the Phase 10 bracket engine.
// A structurally replayable bracket is not proof of a trusted GM-authorized settlement.
const {createPlayoffBracket,recordBracketGame}=require('./hlm-phase10-playoff-bracket');
function inspectPlayoffEvidence(row,seasonSnapshot){
 if(!row||typeof row.game_state_json!=='string')throw Error('Authoritative row required');
 const state=JSON.parse(row.game_state_json);
 const bracket=state?.extensions?.phase10Playoffs;
 const unavailable=reason=>Object.freeze({verified:false,archiveEligible:false,reason,championTeamId:null});
 if(!seasonSnapshot?.regularSeasonComplete)return unavailable('regular-season-incomplete');
 if(!bracket)return unavailable('playoff-evidence-unavailable');
 if(bracket.status!=='complete'||bracket.championTeamId==null)return unavailable('championship-not-complete');
 const rounds=bracket.rounds;
 if(!Array.isArray(rounds)||!Array.isArray(rounds[0])||!rounds[0].length)return unavailable('invalid-playoff-evidence');
 try{
  const first=rounds[0];
  const seeds=first.flatMap(s=>[s.highSeed,s.lowSeed]);
  const reconstructed=createPlayoffBracket(seeds,bracket.bestOf);
  for(const round of rounds){
   if(!Array.isArray(round)||round.length!==reconstructed.rounds.at(-1).length)throw Error('round mismatch');
   for(let index=0;index<round.length;index++){
    const series=round[index];
    if(!Array.isArray(series.games))throw Error('missing games');
    for(const game of series.games){
     if(reconstructed.status!=='active')throw Error('extra games');
     const next=recordBracketGame(reconstructed,index,game);
     Object.assign(reconstructed,next);
    }
   }
  }
  if(reconstructed.status!=='complete'||String(reconstructed.championTeamId)!==String(bracket.championTeamId))
   throw Error('champion mismatch');
  // Replayability alone does not authenticate provenance, GM approval or atomic settlement.
  return Object.freeze({verified:false,archiveEligible:false,
   reason:'authenticated-playoff-settlement-provenance-unavailable',
   championTeamId:null,replayConsistent:true});
 }catch{return unavailable('invalid-playoff-evidence');}
}
module.exports={inspectPlayoffEvidence};
