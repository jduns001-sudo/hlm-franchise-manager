'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');

/**
 * Apply one deterministic game result to a cloned save.
 * The caller owns persistence and standings projection.
 */
function applyScheduledGame(state, gameId, seed, options={}) {
  const validation=validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error=new Error('Invalid game state');
    error.code='INVALID_GAME_STATE';
    throw error;
  }
  if (gameId == null) throw new TypeError('Game id required');
  const nextState=JSON.parse(JSON.stringify(state));
  const matches=nextState.activity.games.filter(game=>game && String(game.id)===String(gameId));
  if (matches.length!==1) throw new Error('Scheduled game must exist exactly once');
  const game=matches[0];
  if (game.status!=='scheduled') throw new Error('Game already played or not scheduled');
  if (!nextState.universe.teams.some(team=>team && String(team.id)===String(game.homeTeamId)) ||
      !nextState.universe.teams.some(team=>team && String(team.id)===String(game.awayTeamId))) {
    throw new Error('Game references unknown team');
  }
  const input={gameId:game.id,homeTeamId:game.homeTeamId,awayTeamId:game.awayTeamId,seed};
  if(options.experimentalRosterAware===true){
    const plan=nextState.extensions?.phase11GmGoaliePlan;
    if(!plan||String(plan.teamId)!==String(nextState.meta.controlledTeamId))throw Error('Explicit GM goalie approval required for experimental roster-aware simulation');
    const side=String(plan.teamId)===String(game.homeTeamId)?'home':String(plan.teamId)===String(game.awayTeamId)?'away':null;
    if(side){
      const goalie=nextState.universe.players.filter(p=>String(p.id)===String(plan.playerId)&&String(p.teamId)===String(plan.teamId)&&p.position==='G');
      if(goalie.length!==1)throw Error('Approved goalie is not eligible');
      if((nextState.activity.injuries||[]).some(i=>String(i.playerId)===String(plan.playerId)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false))throw Error('Approved goalie is injured');
      const rating=goalie[0].overall??goalie[0].ovr;
      if(!Number.isSafeInteger(rating)||rating<1||rating>99)throw Error('Rated goalie required for experimental roster-aware simulation');
      input.experimentalApprovedGoalieOverall=rating;
      input.experimentalApprovedGoalieSide=side;
      // Only the controlled team's current, healthy, rated roster skaters participate.
      // Require three eligible skaters to avoid claiming lineup influence from incomplete rosters.
      const healthy=nextState.universe.players.filter(p=>String(p.teamId)===String(plan.teamId)&&['C','LW','RW','D','F'].includes(String(p.position||'').toUpperCase())&&!(nextState.activity.injuries||[]).some(i=>String(i.playerId)===String(p.id)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false));
      const approved=nextState.extensions?.phase11GmApprovedSkaters;
      let candidates=healthy;
      if(approved!==undefined){
        if(!approved||String(approved.teamId)!==String(plan.teamId)||!Array.isArray(approved.playerIds)||approved.playerIds.length<3||new Set(approved.playerIds.map(String)).size!==approved.playerIds.length)throw Error('Invalid GM-approved skater participation plan');
        const ids=new Set(approved.playerIds.map(String));
        candidates=healthy.filter(p=>ids.has(String(p.id)));
        if(candidates.length!==ids.size)throw Error('Approved skater is not eligible or is injured');
      }
      const eligible=candidates.filter(p=>Number.isSafeInteger(p.overall??p.ovr)&&(p.overall??p.ovr)>=1&&(p.overall??p.ovr)<=99);
      if(approved!==undefined&&eligible.length!==candidates.length)throw Error('Approved skater rating is unavailable');
      if(eligible.length>=3){
        input.experimentalVerifiedSkaterAverage=Math.round(eligible.reduce((total,p)=>total+(p.overall??p.ovr),0)/eligible.length);
        input.experimentalVerifiedSkaterSide=side;
      }
    }
  }
  const result=simulateGameScore(input);
  Object.assign(game,result);
  return {nextState,result};
}
module.exports={applyScheduledGame};
