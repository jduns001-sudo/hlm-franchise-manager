'use strict';

function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
function freezeTeamInput(value){return Object.freeze(value);}

function resolveTeamGameStrengthInput(state, teamId, options = {}) {
  const players = state && state.universe && Array.isArray(state.universe.players) ? state.universe.players : [];
  const roster = players.filter(player => String(player.teamId) === String(teamId) && player.retired !== true);
  const forwards = roster.filter(player => ['C','LW','RW','F'].includes(String(player.position ?? '').toUpperCase()));
  const defense = roster.filter(player => ['D','LD','RD'].includes(String(player.position ?? '').toUpperCase()));
  const goalies = roster.filter(player => ['G','GOALIE'].includes(String(player.position ?? '').toUpperCase()));
  const supplied = options.teamInputs && options.teamInputs[String(teamId)] ? options.teamInputs[String(teamId)] : {};
  return freezeTeamInput({
    teamId,
    playerIds:Object.freeze(roster.map(player=>player.id)),
    forwards:Object.freeze(forwards.map(player=>player.id)),
    defense:Object.freeze(defense.map(player=>player.id)),
    goalies:Object.freeze(goalies.map(player=>player.id)),
    lines:clone(supplied.lines ?? null),
    specialTeams:clone(supplied.specialTeams ?? null),
    coaching:clone(supplied.coaching ?? null),
    chemistry:clone(supplied.chemistry ?? null),
    tactics:clone(supplied.tactics ?? null),
    matchups:clone(supplied.matchups ?? null),
    fatigue:clone(supplied.fatigue ?? null),
    strengthScore:null
  });
}

function createGameStrengthSnapshot(simulationInput, state, options = {}) {
  if (!simulationInput || simulationInput.kind !== 'game-simulation-input') throw new Error('Valid game simulation input required.');
  const home=resolveTeamGameStrengthInput(state,simulationInput.matchup.homeTeamId,options);
  const away=resolveTeamGameStrengthInput(state,simulationInput.matchup.awayTeamId,options);
  return Object.freeze({
    kind:'game-strength-snapshot',version:1,gameId:simulationInput.gameId,
    home,away,
    formulaApplied:false,
    simulationPerformed:false,
    sourceStateMutated:false
  });
}

module.exports={resolveTeamGameStrengthInput,createGameStrengthSnapshot};
