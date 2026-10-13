'use strict';
/** Pure research-only analysis for hypothetical seasons. Never writes franchise state. */
const { runExperimentalSeasonBatch, createExperimentalSchedule } = require('./hlm-experimental-season-batch');
function assertComplete(batch) {
 if(!batch||batch.kind!=='experimental-season-batch'||batch.researchReady!==true||!Array.isArray(batch.games)||!Array.isArray(batch.standings)||batch.games.some(g=>!g.outcome||!g.hypotheticalScore||g.official!==false)) throw new Error('EXPERIMENTAL_SEASON_NOT_READY');
}
function goalDifferentialTable(batch) {
 assertComplete(batch);
 return batch.standings.map(r=>({teamId:r.teamId,goalDifferential:r.goalsFor-r.goalsAgainst,goalsFor:r.goalsFor,goalsAgainst:r.goalsAgainst}));
}
function homeAwaySplits(batch) {
 assertComplete(batch);
 const m=new Map(batch.standings.map(r=>[r.teamId,{teamId:r.teamId,home:{games:0,wins:0},away:{games:0,wins:0}}]));
 for(const g of batch.games) for(const [teamId,side] of [[g.homeTeamId,'home'],[g.awayTeamId,'away']]) {
  const row=m.get(teamId);if(!row)throw new Error('MISSING_TEAM');
  row[side].games++;if(g.outcome.winnerTeamId===teamId)row[side].wins++;
 }
 return [...m.values()];
}
function headToHead(batch) {
 assertComplete(batch);
 const m=new Map();
 for(const g of batch.games) {
  const key=[g.homeTeamId,g.awayTeamId].map(String).sort().join(':');
  if(!m.has(key))m.set(key,{pair:key,games:0,wins:{}});
  const row=m.get(key);row.games++;
  const winner=String(g.outcome.winnerTeamId);
  row.wins[winner]=(row.wins[winner]||0)+1;
 }
 return [...m.values()].sort((a,b)=>a.pair.localeCompare(b.pair));
}
function recentForm(batch,window=5) {
 assertComplete(batch);
 if(!Number.isSafeInteger(window)||window<1||window>64)throw new RangeError('Invalid form window');
 return batch.standings.map(row=>{
  const games=batch.games.filter(g=>g.homeTeamId===row.teamId||g.awayTeamId===row.teamId).slice(-window);
  return {teamId:row.teamId,last:games.map(g=>g.outcome.winnerTeamId===row.teamId?'W':'L').join(''),wins:games.filter(g=>g.outcome.winnerTeamId===row.teamId).length};
 });
}
function experimentalPlayoffSeeds(batch,count=4) {
 assertComplete(batch);
 if(!Number.isSafeInteger(count)||count<2||count>batch.standings.length)throw new RangeError('Invalid seed count');
 return batch.standings.slice(0,count).map((row,i)=>({seed:i+1,teamId:row.teamId,points:row.points}));
}
function seasonIntegrityAudit(batch) {
 assertComplete(batch);
 const expected=new Map(batch.standings.map(row=>[row.teamId,{games:0,wins:0,goalsFor:0,goalsAgainst:0,points:0}]));
 for(const g of batch.games) {
  const {home,away}=g.hypotheticalScore;
  if(!Number.isSafeInteger(home)||home<0||!Number.isSafeInteger(away)||away<0)throw new Error('INVALID_SCORE');
  for(const [id,scored,against] of [[g.homeTeamId,home,away],[g.awayTeamId,away,home]]) {
   const row=expected.get(id);if(!row)throw new Error('MISSING_TEAM');
   row.games++;row.goalsFor+=scored;row.goalsAgainst+=against;
   if(g.outcome.winnerTeamId===id){row.wins++;row.points+=2;}
  }
 }
 const consistent=batch.standings.every(row=>{
  const e=expected.get(row.teamId);
  return e&&['games','wins','goalsFor','goalsAgainst','points'].every(k=>e[k]===row[k]);
 });
 return {consistent,checkedGames:batch.games.length,teamCount:batch.standings.length,official:false};
}
function seasonSnapshot(batch) {
 const audit=seasonIntegrityAudit(batch);
 if(!audit.consistent)throw new Error('INCONSISTENT_EXPERIMENTAL_STANDINGS');
 return {kind:'experimental-season-snapshot',version:1,gameCount:batch.games.length,teams:batch.standings.length,leaders:batch.standings.slice(0,3).map(r=>({teamId:r.teamId,points:r.points})),goalDifferentials:goalDifferentialTable(batch),homeAway:homeAwaySplits(batch),headToHead:headToHead(batch),recentForm:recentForm(batch),integrity:audit,official:false,persistencePerformed:false};
}
function runExperimentalSeasonAnalysis(state,teamIds,seed,rounds=1) {
 const schedule=createExperimentalSchedule(teamIds,rounds);
 const batch=runExperimentalSeasonBatch(state,schedule,seed);
 if(!batch.researchReady)return {kind:'experimental-season-analysis',researchReady:false,blockers:batch.blockers.slice(),snapshot:null,official:false,persistencePerformed:false};
 return {kind:'experimental-season-analysis',researchReady:true,blockers:[],snapshot:seasonSnapshot(batch),official:false,persistencePerformed:false};
}
module.exports={goalDifferentialTable,homeAwaySplits,headToHead,recentForm,experimentalPlayoffSeeds,seasonIntegrityAudit,seasonSnapshot,runExperimentalSeasonAnalysis};
