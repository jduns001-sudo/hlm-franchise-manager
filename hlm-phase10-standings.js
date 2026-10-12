'use strict';

/**
 * Pure standings projection from final game records.
 * Regulation win = 2 points, overtime win = 2, overtime loss = 1.
 * No persistent mutations or schedule changes.
 */
function calculateStandings(teams, games) {
  if (!Array.isArray(teams) || !Array.isArray(games)) throw new TypeError('Teams and games must be arrays');
  const standings = new Map();
  for (const team of teams) {
    if (!team || team.id == null) throw new TypeError('Team requires id');
    const id = String(team.id);
    if (standings.has(id)) throw new Error('Duplicate team id: ' + id);
    standings.set(id, {teamId:team.id, teamName:team.name || null, gp:0, w:0, l:0, otl:0, gf:0, ga:0, points:0});
  }
  const seen = new Set();
  for (const game of games) {
    if (!game || game.status !== 'final') continue;
    if (game.id == null) throw new Error('Final game requires id');
    const gameId=String(game.id);
    if (seen.has(gameId)) throw new Error('Duplicate final game: ' + gameId);
    seen.add(gameId);
    const home=standings.get(String(game.homeTeamId));
    const away=standings.get(String(game.awayTeamId));
    if (!home || !away || home===away) throw new Error('Final game has invalid teams: ' + gameId);
    const hg=game.homeGoals, ag=game.awayGoals;
    if (!Number.isSafeInteger(hg) || !Number.isSafeInteger(ag) || hg<0 || ag<0 || hg===ag) {
      throw new Error('Final game requires non-tied nonnegative integer scores: ' + gameId);
    }
    if (game.overtime != null && typeof game.overtime !== 'boolean') throw new Error('Invalid overtime flag: ' + gameId);
    const winner=hg>ag?home:away;
    const loser=hg>ag?away:home;
    home.gp++;away.gp++;
    home.gf+=hg;home.ga+=ag;away.gf+=ag;away.ga+=hg;
    winner.w++;winner.points+=2;
    if (game.overtime) {loser.otl++;loser.points++;}
    else loser.l++;
  }
  return [...standings.values()].sort((a,b)=>b.points-a.points || b.w-a.w || (b.gf-b.ga)-(a.gf-a.ga) || String(a.teamId).localeCompare(String(b.teamId)));
}
module.exports={calculateStandings};
