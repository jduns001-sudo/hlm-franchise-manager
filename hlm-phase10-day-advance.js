'use strict';
const {validateGameStateEnvelope} = require('./hlm-game-state');
const {addCalendarDays,assertIsoDate} = require('./hlm-master-calendar');

/**
 * Pure calendar advance candidate. Does not simulate games or persist state.
 * Callers must commit the returned state through the approved save pathway.
 */
function prepareDayAdvance(state) {
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Invalid game state');
    error.code = 'INVALID_GAME_STATE';
    error.details = validation.errors;
    throw error;
  }
  assertIsoDate(state.meta.currentDate);
  const fromDate = state.meta.currentDate;
  const toDate = addCalendarDays(fromDate, 1);
  const nextState = JSON.parse(JSON.stringify(state));
  nextState.meta.currentDate = toDate;
  const scheduledToday = nextState.activity.games.filter(game =>
    game && game.status === 'scheduled' && game.date === toDate
  ).map(game => game.id ?? null);
  return {
    fromDate,
    toDate,
    scheduledGameIds: scheduledToday,
    nextState
  };
}
module.exports = {prepareDayAdvance};
