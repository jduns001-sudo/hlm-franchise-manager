'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateRosterWeightedExhibition}=require('./hlm-phase10-roster-weighted-exhibition');
const {recordBracketGame}=require('./hlm-phase10-playoff-bracket');
/** Experimental roster-driven playoff game. Never persists or mutates input. */
function simulateExperimentalRosterPlayoffGame(state,seed=1){
 if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid GameState');
 if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Invalid playoff seed');
 const bracket=state.extensions.phase10Playoffs;
 if(!bracket||bracket.status!=='active')throw new Error('No active playoff bracket');
 const roundIndex=bracket.rounds.length-1,round=bracket.rounds[roundIndex];
 const seriesIndex=round.findIndex(s=>s.status==='active');
 if(seriesIndex<0)throw new Error('No active playoff series');
 const series=round[seriesIndex],gameNumber=series.games.length+1;
 const high=series.highSeed.teamId,low=series.lowSeed.teamId;
 const homeTeamId=[1,2,5,7].includes(gameNumber%7||7)?high:low;
 const awayTeamId=homeTeamId===high?low:high;
 const gameId='PO-R'+(roundIndex+1)+'-S'+(seriesIndex+1)+'-G'+gameNumber;
 const exhibition=simulateRosterWeightedExhibition(state,homeTeamId,awayTeamId,seed);
 if(!exhibition.playable)return {advanced:false,blockers:exhibition.blockers,nextState:null,exhibition,
  official:false,persistencePerformed:false};
 const result={gameId,homeTeamId,awayTeamId,status:'final',homeGoals:exhibition.score.homeGoals,
  awayGoals:exhibition.score.awayGoals,overtime:exhibition.score.overtime,
  winnerTeamId:exhibition.score.winnerTeamId,official:false,simulationMode:'experimental-roster-weighted'};
 const nextBracket=recordBracketGame(bracket,seriesIndex,result);
 const nextState=JSON.parse(JSON.stringify(state));
 nextState.extensions.phase10Playoffs=nextBracket;
 return {advanced:true,blockers:[],nextState,result,bracket:nextBracket,
  championTeamId:nextBracket.championTeamId,official:false,persistencePerformed:false};
}
module.exports={simulateExperimentalRosterPlayoffGame};
