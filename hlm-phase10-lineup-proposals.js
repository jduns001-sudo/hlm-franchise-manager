'use strict';

/**
 * Mission 722: deterministic, read-only lineup proposals from Mission 721.
 * Proposed players are not authorized for simulation.
 */
const { assessSimulationLineupCandidates } = require('./hlm-phase10-lineup-candidate-assessment');

const SKATER_SLOTS = ['C', 'LW', 'RW', 'D', 'D'];
const REQUIRED_GOALIES = 1;

function createSimulationLineupProposals(state) {
  const assessment = assessSimulationLineupCandidates(state);
  const teams = assessment.teams.map(team => {
    const candidates = team.candidates.slice().sort((a, b) =>
      b.overall - a.overall || a.playerId - b.playerId
    );
    const selected = new Set();
    const slots = SKATER_SLOTS.map(position => {
      const player = candidates.find(p => p.position === position && !selected.has(p.playerId));
      if (!player) return { position, playerId: null, overall: null };
      selected.add(player.playerId);
      return { position, playerId: player.playerId, overall: player.overall };
    });
    const goalie = candidates.find(p => p.position === 'G');
    if (goalie) selected.add(goalie.playerId);
    const goalieSlot = {
      position: 'G',
      playerId: goalie ? goalie.playerId : null,
      overall: goalie ? goalie.overall : null
    };
    const missingSlots = slots.filter(slot => slot.playerId === null).map(slot => slot.position);
    if (!goalie) missingSlots.push('G');
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      skaterSlots: slots,
      goalieSlot,
      missingSlots,
      benchPlayerIds: candidates.filter(p => !selected.has(p.playerId)).map(p => p.playerId),
      excludedPlayerIds: team.excluded.map(p => p.playerId),
      proposalComplete: missingSlots.length === 0,
      lineupAuthorized: false
    };
  });
  return {
    kind: 'phase10-lineup-proposals',
    version: 1,
    slotDefinition: { skaters: SKATER_SLOTS.slice(), goalies: REQUIRED_GOALIES },
    teams,
    unresolvedPlayers: assessment.unresolvedPlayers.map(p => ({ ...p })),
    diagnostics: assessment.diagnostics.map(d => ({ ...d })),
    validation: { ...assessment.validation },
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createSimulationLineupProposals };
