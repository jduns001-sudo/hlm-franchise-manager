'use strict';
const {prepareDayAdvance}=require('./hlm-phase10-day-advance');
const {applyScheduledGame}=require('./hlm-phase10-apply-game');
const {calculateStandings}=require('./hlm-phase10-standings');

/**
 * Pure one-day simulation transaction. Returns a candidate state and standings;
 * persistence is deliberately delegated to the caller.
 */
function simulateNextDay(state, seed=0, options={}) {
  if (!Number.isSafeInteger(seed) || seed<0) throw new TypeError('Seed must be a nonnegative safe integer');
  const day=prepareDayAdvance(state);
  let nextState=day.nextState;
  const results=[];
  const games=nextState.activity.games.filter(game=>game && game.status==='scheduled' && game.date===day.toDate);
  const ids=new Set();
  for (const game of games) {
    if (game.id==null || ids.has(String(game.id))) throw new Error('Duplicate or missing scheduled game id');
    ids.add(String(game.id));
  }
  for (const game of games) {
    const applied=applyScheduledGame(nextState,game.id,seed,options);
    nextState=applied.nextState;
    results.push(applied.result);
  }
  const standings=calculateStandings(nextState.universe.teams,nextState.activity.games);
  return {fromDate:day.fromDate,toDate:day.toDate,nextState,results,standings};
}
module.exports={simulateNextDay};
