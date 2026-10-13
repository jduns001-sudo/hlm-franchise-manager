'use strict';

/**
 * Mission 729: explicit official-game authorization prerequisites.
 * Advisory only. No token is issued and no result may be applied.
 */
const { assessOfficialRosterGameIntegration } = require('./hlm-phase10-official-roster-game-gate');

const REQUIRED_RULES = Object.freeze([
  'lineupEligibility', 'regulationScoring', 'overtimeResolution',
  'standingsPoints', 'resultPersistence'
]);

function assessOfficialGameAuthorization(state, rules = {}, seed = 1) {
  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) {
    const error = new TypeError('A rules capability object is required');
    error.code = 'INVALID_OFFICIAL_GAME_RULES';
    throw error;
  }
  const gate = assessOfficialRosterGameIntegration(state, seed);
  const missingCapabilities = REQUIRED_RULES.filter(key => rules[key] !== true);
  const games = gate.games.map(game => ({
    gameId: game.gameId,
    date: game.date,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    previewAvailable: game.previewAvailable,
    blockers: [
      ...game.blockers,
      ...missingCapabilities.map(key => 'RULE_CAPABILITY_UNVERIFIED:' + key),
      'OFFICIAL_RESULT_APPLICATION_NOT_IMPLEMENTED'
    ],
    canApplyOfficialResult: false
  }));
  return {
    kind: 'phase10-official-game-authorization-assessment',
    version: 1,
    requiredRuleCapabilities: REQUIRED_RULES.slice(),
    declaredRuleCapabilities: REQUIRED_RULES.filter(key => rules[key] === true),
    missingRuleCapabilities: missingCapabilities,
    scheduledGameCount: gate.scheduledGameCount,
    blockedGameCount: games.length,
    games,
    authorizationIssued: false,
    officialResultCount: 0,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { REQUIRED_RULES, assessOfficialGameAuthorization };
