'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');
const {recordBracketGame}=require('./hlm-phase10-playoff-bracket');

/** Simulate one playoff game, advancing the active bracket without mutating input. */
function simulateNextPlayoffGame(state,seed=0) {
  const validation=validateGameStateEnvelope(state);
  if(!validation.valid)throw new Error('Invalid franchise game state');
  if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Invalid simulation seed');
  const bracket=state.extensions.phase10Playoffs;
  if(!bracket||bracket.status!=='active')throw new Error('No active playoff bracket');
  const roundIndex=bracket.rounds.length-1;
  const round=bracket.rounds[roundIndex];
  const seriesIndex=round.findIndex(s=>s.status==='active');
  if(seriesIndex<0)throw new Error('No active playoff series');
  const series=round[seriesIndex];
  const gameNumber=series.games.length+1;
  const high=series.highSeed.teamId,low=series.lowSeed.teamId;
  const highHome=[1,2,5,7].includes(gameNumber%7||7);
  const homeTeamId=highHome?high:low,awayTeamId=highHome?low:high;
  const gameId='PO-R'+(roundIndex+1)+'-S'+(seriesIndex+1)+'-G'+gameNumber;
  const result=simulateGameScore({gameId,homeTeamId,awayTeamId,seed});
  const nextBracket=recordBracketGame(bracket,seriesIndex,result);
  const nextState=JSON.parse(JSON.stringify(state));
  nextState.extensions.phase10Playoffs=nextBracket;
  return {nextState,result,bracket:nextBracket,roundIndex,seriesIndex,championTeamId:nextBracket.championTeamId};
}
module.exports={simulateNextPlayoffGame};
