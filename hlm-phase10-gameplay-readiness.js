'use strict';
const { validateGameStateEnvelope } = require('./hlm-game-state');
const { assertIsoDate } = require('./hlm-master-calendar');

function auditGameplayReadiness(state) {
  const validation = validateGameStateEnvelope(state);
  const issues = validation.errors.map(({code, section}) => ({code, section: section || null}));
  if (!validation.valid) return {ready: false, issues, snapshot: null};

  const {meta, universe, activity} = state;
  const team = universe.teams.find(item => item && String(item.id) === String(meta.controlledTeamId));
  if (meta.controlledTeamId == null || !team) issues.push({code: 'CONTROLLED_TEAM_NOT_FOUND'});
  try { assertIsoDate(meta.currentDate); }
  catch (_) { issues.push({code: 'INVALID_CURRENT_DATE'}); }
  if (typeof meta.saveId !== 'string' || !meta.saveId.trim()) issues.push({code: 'MISSING_SAVE_ID'});
  const scheduledGames = activity.games.filter(game => game && game.status === 'scheduled').length;
  const finalGames = activity.games.filter(game => game && game.status === 'final').length;
  if (!scheduledGames && !finalGames) issues.push({code: 'NO_SEASON_GAMES'});
  return {
    ready: issues.length === 0,
    issues,
    snapshot: {
      saveId: meta.saveId || null,
      controlledTeamId: meta.controlledTeamId ?? null,
      controlledTeamName: team ? team.name || null : null,
      currentDate: meta.currentDate || null,
      teamCount: universe.teams.length,
      playerCount: universe.players.length,
      scheduledGames,
      finalGames
    }
  };
}
module.exports = {auditGameplayReadiness};
