'use strict';
/** Experimental box scores derived from authoritative roster-day goal events, not a second game simulation. */
function buildUnifiedBoxScores(state,games,goalEvents,seed=1){
 if(!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid seed');
 const output=[];const seen=new Set();
 for(const game of games){
  if(game.status!=='final')throw Error('Final game required');
  const id=String(game.id);
  if(seen.has(id))throw Error('Duplicate game');seen.add(id);
  const sides=[['home',game.homeTeamId,game.homeGoals],['away',game.awayTeamId,game.awayGoals]];
  const rows={};const eventKeys=new Set();
  for(const [side,teamId,goals] of sides){
   const skaters=state.universe.players.filter(p=>String(p.teamId)===String(teamId)&&['C','LW','RW','D'].includes(p.position)).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
   const goalies=state.universe.players.filter(p=>String(p.teamId)===String(teamId)&&p.position==='G').sort((a,b)=>String(a.id).localeCompare(String(b.id)));
   if(!skaters.length||!goalies.length)throw Error('Missing roster participants');
   const players=skaters.map(p=>({playerId:p.id,goals:0,assists:0,shots:0,points:0}));
   const byId=new Map(players.map(p=>[String(p.playerId),p]));
   const events=goalEvents.filter(e=>String(e.gameId)===id&&String(e.teamId)===String(teamId));
   if(events.length!==goals)throw Error('Goal event score mismatch');
   for(const e of events){
    const key=id+':'+String(teamId)+':'+String(e.sequence);
    if(eventKeys.has(key))throw Error('Duplicate goal event');eventKeys.add(key);
    const scorer=byId.get(String(e.playerId));
    if(!scorer)throw Error('Scorer not on team');
    scorer.goals++;scorer.shots++;
    const eligible=players.filter(p=>String(p.playerId)!==String(e.playerId));
    const index=(seed+Number(e.sequence))%Math.max(1,eligible.length);
    if(eligible.length){eligible[index].assists++;if(eligible.length>1)eligible[(index+1)%eligible.length].assists++;}
   }
   // Non-goal shots are deterministically attributed without resimulating the result.
   const extra=6+(seed+id.length+String(teamId).length)%7;
   for(let i=0;i<extra;i++)players[(seed+i)%players.length].shots++;
   for(const p of players)p.points=p.goals+p.assists;
   rows[side]={teamId,players,shots:players.reduce((n,p)=>n+p.shots,0),goals,goalie:{playerId:goalies[0].id}};
  }
  for(const side of ['home','away']){
   const goalie=rows[side].goalie,opponent=rows[side==='home'?'away':'home'];
   goalie.shotsAgainst=opponent.shots;goalie.goalsAgainst=opponent.goals;
   goalie.saves=goalie.shotsAgainst-goalie.goalsAgainst;
   goalie.savePercentage=goalie.shotsAgainst?goalie.saves/goalie.shotsAgainst:null;
   if(goalie.saves<0)throw Error('Negative saves');
  }
  output.push({gameId:game.id,playoff:Boolean(game.playoff||game.isPlayoff),home:rows.home,away:rows.away,experimental:true,official:false});
 }
 return output;
}
module.exports={buildUnifiedBoxScores};
