'use strict';

/**
 * Deterministic prototype score simulator. Not a player-stat or standings engine.
 * Same matchup and seed always produce the same result.
 */
function simulateGameScore(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Game input must be an object');
  const {gameId, homeTeamId, awayTeamId, seed} = input;
  const rating=input.experimentalApprovedGoalieOverall;
  if(rating!==undefined&&(!Number.isSafeInteger(rating)||rating<1||rating>99))throw Error('Invalid experimental approved goalie rating');
  if (gameId == null || homeTeamId == null || awayTeamId == null ||
      String(homeTeamId) === String(awayTeamId) ||
      !Number.isSafeInteger(seed) || seed < 0) {
    const error = new Error('Invalid game simulation input');
    error.code = 'INVALID_GAME_INPUT';
    throw error;
  }
  let state = seed >>> 0;
  const mix = String(gameId) + '|' + String(homeTeamId) + '|' + String(awayTeamId);
  for (let i = 0; i < mix.length; i++) state = (Math.imul(state ^ mix.charCodeAt(i), 16777619)) >>> 0;
  const next = () => {state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296;};
  const homeGoals = Math.floor(next() * 6);
  const awayGoals = Math.floor(next() * 6);
  const overtime = homeGoals === awayGoals;
  const finalHome = homeGoals + (overtime && next() >= 0.5 ? 1 : 0);
  const finalAway = awayGoals + (overtime && finalHome === homeGoals ? 1 : 0);
  // Experimental, opt-in-only bounded goalie effect; legacy deterministic results remain unchanged.
  let adjustedAway=finalAway;
  if(rating!==undefined){
    const shift=rating>=85?-1:rating<=65?1:0;
    adjustedAway=Math.max(0,finalAway+shift);
  }
  let adjustedHome=finalHome;
  if(rating!==undefined&&adjustedHome===adjustedAway){
    // Preserve a winner deterministically; a tie created by the experimental adjustment goes to OT.
    if((seed+String(gameId).length)%2===0)adjustedHome++;
    else adjustedAway++;
  }
  return Object.freeze({
    gameId, homeTeamId, awayTeamId,
    homeGoals: adjustedHome, awayGoals: adjustedAway,
    overtime: rating===undefined?overtime:(overtime||adjustedHome===adjustedAway+1||adjustedAway===adjustedHome+1), winnerTeamId: adjustedHome > adjustedAway ? homeTeamId : awayTeamId,
    ...(rating===undefined?{}:{experimentalRosterAware:true,official:false}),
    status: 'final'
  });
}
if (typeof module === 'object' && module.exports) module.exports = {simulateGameScore};
if (typeof window !== 'undefined') window.HLMPhase10GameSimulator = Object.freeze({simulateGameScore});
