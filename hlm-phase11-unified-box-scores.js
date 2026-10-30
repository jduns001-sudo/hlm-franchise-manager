(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMUnifiedBoxScores=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
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
   const skaters=eligibleExperimentalSkaters(state,teamId);
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
   const plan=state.extensions?.phase11GmGoaliePlan;
   let selected=goalies[0];
   if(plan&&String(plan.teamId)===String(teamId)&&String(state.meta?.controlledTeamId)===String(teamId)){
    const matches=goalies.filter(p=>String(p.id)===String(plan.playerId));
    if(matches.length!==1)throw Error('Approved GM goalie plan is no longer valid for this roster');
    const injured=(state.activity?.injuries||[]).some(i=>String(i.playerId)===String(plan.playerId)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false);
    if(injured)throw Error('Approved GM goalie has an unresolved injury; simulation save blocked');
    selected=matches[0];
   }
   rows[side]={teamId,players,shots:players.reduce((n,p)=>n+p.shots,0),goals,goalie:{playerId:selected.id}};
  }
  for(const side of ['home','away']){
   const goalie=rows[side].goalie,opponent=rows[side==='home'?'away':'home'];
   goalie.shotsAgainst=opponent.shots;goalie.goalsAgainst=opponent.goals;
   goalie.saves=goalie.shotsAgainst-goalie.goalsAgainst;
   goalie.savePercentage=goalie.shotsAgainst?goalie.saves/goalie.shotsAgainst:null;
   if(goalie.saves<0)throw Error('Negative saves');
  }
  output.push({gameId:game.id,season:game.season??game.seasonId??null,playoff:Boolean(game.playoff||game.isPlayoff),home:rows.home,away:rows.away,experimental:true,official:false,attributionModel:'synthetic-from-roster-goals-v1'});
 }
 return output;
}
function eligibleExperimentalSkaters(state,teamId){
 if(!Array.isArray(state?.universe?.players))throw Error('Valid player roster required');
 const injured=id=>(state.activity?.injuries||[]).some(i=>String(i.playerId)===String(id)&&!['resolved','recovered'].includes(String(i.status||'').toLowerCase())&&i.active!==false);
 const eligible=state.universe.players.filter(p=>String(p.teamId)===String(teamId)&&['C','LW','RW','D','F'].includes(String(p.position||'').toUpperCase())&&!injured(p.id));
 const controlled=String(state.meta?.controlledTeamId)===String(teamId),plan=state.extensions?.phase11GmApprovedSkaters;
 if(!controlled||plan==null)return eligible.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 if(String(plan.teamId)!==String(teamId)||!Array.isArray(plan.playerIds)||plan.playerIds.length<3||new Set(plan.playerIds.map(String)).size!==plan.playerIds.length)throw Error('Invalid GM-approved skater participation plan');
 const ids=new Set(plan.playerIds.map(String));
 const selected=eligible.filter(p=>ids.has(String(p.id)));
 if(selected.length!==ids.size)throw Error('GM-approved skater is unavailable, injured, or no longer eligible');
 for(const p of selected){
  const rating=p.overall??p.ovr;
  if(!Number.isSafeInteger(rating)||rating<1||rating>99)throw Error('Rated GM-approved skater required');
 }
 return selected.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
}
/** Aggregate immutable game reports, keeping playoff and season boundaries separate. */
function aggregateUnifiedBoxScores(boxScores){
 const seasons=new Map();const games=new Set();
 for(const box of boxScores){
  if(!box||box.experimental!==true||box.official!==false)throw Error('Experimental report required');
  const gameKey=String(box.season??'unspecified')+':'+String(box.gameId);
  if(games.has(gameKey))throw Error('Duplicate season game box score');games.add(gameKey);
  const season=String(box.season??'unspecified'),kind=box.playoff?'playoffs':'regular';
  const key=season+':'+kind;
  if(!seasons.has(key))seasons.set(key,{season,kind,games:0,players:new Map(),goalies:new Map()});
  const bucket=seasons.get(key);bucket.games++;
  for(const side of ['home','away']){
   const team=box[side];
   if(team.players.reduce((n,p)=>n+p.goals,0)!==team.goals||team.players.reduce((n,p)=>n+p.shots,0)!==team.shots)throw Error('Team box score mismatch');
   for(const p of team.players){
    if(p.points!==p.goals+p.assists||p.shots<p.goals)throw Error('Player box score mismatch');
    const id=String(team.teamId)+':'+String(p.playerId);
    const row=bucket.players.get(id)||{teamId:team.teamId,playerId:p.playerId,games:0,goals:0,assists:0,shots:0,points:0};
    row.games++;for(const stat of ['goals','assists','shots','points'])row[stat]+=p[stat];
    bucket.players.set(id,row);
   }
   const g=team.goalie;
   if(g.saves+g.goalsAgainst!==g.shotsAgainst||g.saves<0)throw Error('Goalie box score mismatch');
   const id=String(team.teamId)+':'+String(g.playerId);
   const row=bucket.goalies.get(id)||{teamId:team.teamId,playerId:g.playerId,games:0,saves:0,shotsAgainst:0,goalsAgainst:0};
   row.games++;for(const stat of ['saves','shotsAgainst','goalsAgainst'])row[stat]+=g[stat];
   bucket.goalies.set(id,row);
  }
 }
 return [...seasons.values()].map(s=>({season:s.season,kind:s.kind,games:s.games,
  players:[...s.players.values()].sort((a,b)=>String(a.teamId).localeCompare(String(b.teamId))||String(a.playerId).localeCompare(String(b.playerId))),
  goalies:[...s.goalies.values()].map(g=>({...g,savePercentage:g.shotsAgainst?g.saves/g.shotsAgainst:null})).sort((a,b)=>String(a.teamId).localeCompare(String(b.teamId))||String(a.playerId).localeCompare(String(b.playerId))),
  experimental:true,official:false
 })).sort((a,b)=>a.season.localeCompare(b.season)||a.kind.localeCompare(b.kind));
}
return {buildUnifiedBoxScores,aggregateUnifiedBoxScores,eligibleExperimentalSkaters};
});
