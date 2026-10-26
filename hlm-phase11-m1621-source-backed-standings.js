'use strict';
/* Mission 1621: read-only source-backed standings and final results.
 * No persistence, simulated outcomes, or alternate scoring rules.
 */
const {calculateStandings}=require('./hlm-phase10-standings');
function project(state){
  const teams=state?.universe?.teams, games=state?.activity?.games;
  if(!Array.isArray(teams)||!Array.isArray(games))throw Error('Authoritative isolated universe unavailable');
  const names=new Map();
  for(const team of teams){
    if(!team||team.id==null)throw Error('Authoritative team id missing');
    const id=String(team.id);
    if(names.has(id))throw Error('Duplicate authoritative team id: '+id);
    names.set(id,String(team.name||id));
  }
  const seen=new Set(),finals=[];
  for(const game of games){
    if(!game||game.id==null)throw Error('Authoritative game id missing');
    const id=String(game.id);
    if(seen.has(id))throw Error('Duplicate authoritative game id: '+id);
    seen.add(id);
    if(game.status!=='scheduled'&&game.status!=='final')throw Error('Unsupported authoritative game status: '+id);
    const home=String(game.homeTeamId),away=String(game.awayTeamId);
    if(!names.has(home)||!names.has(away)||home===away)throw Error('Invalid authoritative game teams: '+id);
    if(game.status!=='final')continue;
    if(!Number.isSafeInteger(game.homeGoals)||!Number.isSafeInteger(game.awayGoals)||game.homeGoals<0||game.awayGoals<0||game.homeGoals===game.awayGoals)throw Error('Invalid authoritative final score: '+id);
    if(game.overtime!=null&&typeof game.overtime!=='boolean')throw Error('Invalid authoritative overtime flag: '+id);
    finals.push(Object.freeze({id,date:String(game.date||''),homeTeamId:game.homeTeamId,awayTeamId:game.awayTeamId,home:names.get(home),away:names.get(away),homeGoals:game.homeGoals,awayGoals:game.awayGoals,overtime:game.overtime===true}));
  }
  const standings=calculateStandings(teams,games).map(row=>Object.freeze({...row}));
  finals.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  return Object.freeze({standings:Object.freeze(standings),results:Object.freeze(finals)});
}
module.exports={project};
