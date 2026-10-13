'use strict';
/** Hypothetical shot and goal attribution lab. Read-only; not actual game statistics. */
const {simulateExperimentalHockeyGame,nextRandom,validatePeriodScore}=require('./hlm-experimental-hockey-periods');
const {deriveGameSeed}=require('./hlm-experimental-season-batch');
function activeSkaters(state,teamId){
 if(!state||!state.universe||!state.assets||!state.activity)throw new TypeError('Invalid game state');
 const contracts=new Set(state.assets.contracts.filter(c=>c.teamId===teamId&&c.status==='Active').map(c=>c.playerId));
 const unavailable=new Set(state.activity.injuries.filter(i=>i.status!=='Recovered').map(i=>i.playerId));
 return state.universe.players.filter(p=>p.teamId===teamId&&p.position!=='G'&&contracts.has(p.id)&&!unavailable.has(p.id)&&Number.isFinite(p.ovr)).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
}
function activeGoalie(state,teamId){
 const contracts=new Set(state.assets.contracts.filter(c=>c.teamId===teamId&&c.status==='Active').map(c=>c.playerId));
 const unavailable=new Set(state.activity.injuries.filter(i=>i.status!=='Recovered').map(i=>i.playerId));
 return state.universe.players.filter(p=>p.teamId===teamId&&p.position==='G'&&contracts.has(p.id)&&!unavailable.has(p.id)).sort((a,b)=>String(a.id).localeCompare(String(b.id)))[0]||null;
}
function weightedSkater(skaters,next){
 const total=skaters.reduce((n,p)=>n+Math.max(1,p.ovr),0);
 let choice=next()*total;
 for(const p of skaters){choice-=Math.max(1,p.ovr);if(choice<0)return p;}
 return skaters[skaters.length-1];
}
function allocateShots(goals,skaters,next){
 if(!Number.isSafeInteger(goals)||goals<0||goals>100||!skaters.length)throw new RangeError('Invalid shot allocation');
 const shots=Math.min(100,Math.max(goals,Math.round(24+next()*16)));
 const records=skaters.map(p=>({playerId:p.id,shots:0,goals:0,assists:0}));
 const lookup=new Map(records.map(r=>[r.playerId,r]));
 for(let i=0;i<shots;i++){
  const p=weightedSkater(skaters,next);const row=lookup.get(p.id);row.shots++;
  if(i<goals){row.goals++;}
 }
 return {shots,records};
}
function assignAssists(records,next){
 const scorers=records.filter(r=>r.goals>0);
 for(const scorer of scorers)for(let i=0;i<scorer.goals;i++){
  const eligible=records.filter(r=>r.playerId!==scorer.playerId);
  if(!eligible.length)continue;
  const first=eligible[Math.floor(next()*eligible.length)];first.assists++;
  if(eligible.length>1&&next()<0.55){
   const second=eligible.filter(r=>r.playerId!==first.playerId);
   second[Math.floor(next()*second.length)].assists++;
  }
 }
 return records;
}
function createExperimentalPlayerBoxScore(state,homeTeamId,awayTeamId,seed,playoff=false){
 const game=simulateExperimentalHockeyGame(state,homeTeamId,awayTeamId,seed,playoff);
 if(!game.researchReady)return {kind:'experimental-player-box-score',researchReady:false,blockers:game.blockers.slice(),game:null,teams:null,official:false,persistencePerformed:false};
 const home=activeSkaters(state,homeTeamId),away=activeSkaters(state,awayTeamId);
 const homeGoalie=activeGoalie(state,homeTeamId),awayGoalie=activeGoalie(state,awayTeamId);
 if(!home.length||!away.length||!homeGoalie||!awayGoalie)return {kind:'experimental-player-box-score',researchReady:false,blockers:['INCOMPLETE_ACTIVE_SKATER_OR_GOALIE_ROSTER'],game:null,teams:null,official:false,persistencePerformed:false};
 const next=nextRandom(deriveGameSeed(seed,3));
 const totals=game.periods.reduce((acc,p)=>({home:acc.home+p.home,away:acc.away+p.away}),{home:0,away:0});
 const h=allocateShots(totals.home,home,next),a=allocateShots(totals.away,away,next);
 assignAssists(h.records,next);assignAssists(a.records,next);
 const teams={
  home:{teamId:homeTeamId,shots:h.shots,goals:totals.home,players:h.records,goalie:{playerId:homeGoalie.id,shotsAgainst:a.shots,goalsAgainst:totals.away,saves:a.shots-totals.away}},
  away:{teamId:awayTeamId,shots:a.shots,goals:totals.away,players:a.records,goalie:{playerId:awayGoalie.id,shotsAgainst:h.shots,goalsAgainst:totals.home,saves:h.shots-totals.home}}
 };
 return {kind:'experimental-player-box-score',researchReady:true,blockers:[],game,teams,official:false,persistencePerformed:false};
}
function auditExperimentalPlayerBoxScore(box){
 if(!box||!box.researchReady||!box.teams)return {consistent:false,reason:'NOT_READY'};
 const validPeriods=validatePeriodScore(box.game).valid;
 const valid=['home','away'].every(side=>{
  const team=box.teams[side],opponent=box.teams[side==='home'?'away':'home'];
  return team.players.reduce((n,p)=>n+p.shots,0)===team.shots&&
   team.players.reduce((n,p)=>n+p.goals,0)===team.goals&&
   team.players.every(p=>p.goals<=p.shots&&p.assists>=0)&&
   team.goalie.shotsAgainst===opponent.shots&&team.goalie.goalsAgainst===opponent.goals&&
   team.goalie.saves+team.goalie.goalsAgainst===team.goalie.shotsAgainst;
 });
 return {consistent:validPeriods&&valid,official:false};
}
module.exports={activeSkaters,activeGoalie,weightedSkater,allocateShots,assignAssists,createExperimentalPlayerBoxScore,auditExperimentalPlayerBoxScore};
