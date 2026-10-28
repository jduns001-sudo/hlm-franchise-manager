'use strict';
// Experimental read-only projection from an authoritative Block L SQLite row.
// No database connection, browser save, history write, or automatic lifecycle transition.
const {calculateStandings}=require('./hlm-phase10-standings');
function projectCommittedSeasonSnapshot(row) {
 if(!row||!Number.isSafeInteger(row.revision)||row.revision<0||typeof row.game_state_json!=='string')
   throw Error('Authoritative SQLite row required');
 const state=JSON.parse(row.game_state_json);
 const season=state?.season,teams=state?.universe?.teams;
 if(!season||!Array.isArray(season.games)||!Array.isArray(teams)||typeof season.id!=='string'||!season.id)
   throw Error('Incomplete authoritative season');
 const seen=new Set(),games=[];
 for(const game of season.games){
   if(!game||typeof game.id!=='string'||!game.id||seen.has(game.id)||!['scheduled','final'].includes(game.status))
     throw Error('Invalid or duplicate game');
   seen.add(game.id);
   if(typeof game.home!=='string'||typeof game.away!=='string'||game.home===game.away)
     throw Error('Invalid game participants');
   const record={id:game.id,status:game.status,homeTeamId:game.home,awayTeamId:game.away};
   if(game.status==='final'){
     record.homeGoals=game.homeGoals;record.awayGoals=game.awayGoals;record.overtime=game.overtime===true;
     if(game.overtime!=null&&typeof game.overtime!=='boolean')throw Error('Invalid overtime provenance');
   }
   games.push(record);
 }
 const finals=games.filter(g=>g.status==='final');
 const standings=calculateStandings(teams,finals);
 if(!Array.isArray(season.standings)||season.standings.length!==standings.length)
   throw Error('Missing committed standings');
 const committed=new Map(season.standings.map(x=>[String(x.teamId),x]));
 if(committed.size!==standings.length)throw Error('Duplicate committed standings');
 for(const row of standings){
   const saved=committed.get(String(row.teamId));
   if(!saved||['gp','w','l','otl','gf','ga','points'].some(k=>saved[k]!==row[k]))
     throw Error('Committed standings disagree with final games');
 }
 const decisions=season.completedDayDecisions??[];
 if(!Array.isArray(decisions)||decisions.some(x=>typeof x!=='string'||!x)||new Set(decisions).size!==decisions.length)
   throw Error('Invalid committed decision ledger');
 const complete=games.length>0&&games.every(g=>g.status==='final');
 // The synthetic SQLite shape has no verified playoff bracket: never claim a champion.
 return Object.freeze({official:false,productionActivationEnabled:false,source:'isolated-sqlite',
   franchiseRevision:row.revision,seasonId:season.id,regularSeasonComplete:complete,
   championshipVerified:false,lifecycleArchiveEligible:false,
   games:structuredClone(games),standings:structuredClone(standings),
   completedDayDecisions:[...decisions]});
}
module.exports={projectCommittedSeasonSnapshot};
