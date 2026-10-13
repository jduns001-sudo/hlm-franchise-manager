'use strict';
/** Experimental, opt-in, in-memory season lab. No official results or persistence. */
const { createExperimentalSimulationDryRun } = require('./hlm-phase10-experimental-simulation-dry-run');
const MAX_GAMES = 64;
function assertSeed(seed) { if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff) throw new RangeError('Invalid unsigned seed'); }
function assertSchedule(schedule) {
 if(!Array.isArray(schedule)||schedule.length<1||schedule.length>MAX_GAMES) throw new RangeError('Schedule must have 1-64 games');
 const ids=new Set();
 for(const game of schedule) {
  if(!game||!Number.isSafeInteger(game.id)||ids.has(game.id)||game.homeTeamId==null||game.awayTeamId==null||game.homeTeamId===game.awayTeamId) throw new TypeError('Invalid game or duplicate ID');
  ids.add(game.id);
 }
}
function deriveGameSeed(seed,index) { assertSeed(seed); if(!Number.isSafeInteger(index)||index<0) throw new RangeError('Invalid index'); return (seed+Math.imul(index,2654435761))>>>0; }
function createExperimentalSchedule(teamIds,rounds=1) {
 if(!Array.isArray(teamIds)||teamIds.length<2||teamIds.length>16||new Set(teamIds).size!==teamIds.length||teamIds.some(id=>id==null)) throw new TypeError('Invalid team IDs');
 if(!Number.isSafeInteger(rounds)||rounds<1||rounds>2) throw new RangeError('Invalid rounds');
 const schedule=[];
 for(let round=0;round<rounds;round++) for(let i=0;i<teamIds.length;i++) for(let j=i+1;j<teamIds.length;j++) {
  if(schedule.length>=MAX_GAMES) throw new RangeError('Schedule exceeds 64 games');
  schedule.push({id:schedule.length+1,homeTeamId:round%2===0?teamIds[i]:teamIds[j],awayTeamId:round%2===0?teamIds[j]:teamIds[i]});
 }
 return schedule;
}
function simulateExperimentalGame(state,game,seed) {
 assertSeed(seed);
 const run=createExperimentalSimulationDryRun(state,game.homeTeamId,game.awayTeamId,seed);
 return {gameId:game.id,homeTeamId:game.homeTeamId,awayTeamId:game.awayTeamId,seed,researchReady:run.researchReady,blockers:run.blockers.slice(),hypotheticalScore:run.hypotheticalScore?{...run.hypotheticalScore}:null,official:false};
}
function applyExperimentalOvertime(game) {
 if(!game.researchReady||!game.hypotheticalScore) return {...game,overtime:null};
 const tied=game.hypotheticalScore.home===game.hypotheticalScore.away;
 return {...game,overtime:tied?{required:true,decided:false}: {required:false,decided:true}};
}
function applyExperimentalShootout(game) {
 if(!game.overtime||!game.overtime.required) return {...game,shootout:null};
 const homeWins=((game.seed>>>0)&1)===0;
 return {...game,shootout:{experimental:true,homeWins,awayWins:!homeWins}};
}
function createExperimentalGameOutcome(game) {
 if(!game.researchReady||!game.hypotheticalScore) return {...game,outcome:null};
 const {home,away}=game.hypotheticalScore;
 const winner=home>away?game.homeTeamId:away>home?game.awayTeamId:game.shootout?.homeWins?game.homeTeamId:game.awayTeamId;
 return {...game,outcome:{winnerTeamId:winner,decidedBy:home===away?'hypothetical-shootout':'hypothetical-regulation',official:false}};
}
function createExperimentalStandings(games,teamIds) {
 const rows=new Map(teamIds.map(teamId=>[teamId,{teamId,games:0,wins:0,losses:0,goalsFor:0,goalsAgainst:0,points:0}]));
 for(const game of games) {
  if(!game.outcome) continue;
  const {home,away}=game.hypotheticalScore;
  for(const [teamId,scored,conceded] of [[game.homeTeamId,home,away],[game.awayTeamId,away,home]]) {
   const row=rows.get(teamId); if(!row) throw new Error('Game team absent from standings');
   row.games++;row.goalsFor+=scored;row.goalsAgainst+=conceded;
   if(game.outcome.winnerTeamId===teamId){row.wins++;row.points+=2;}else row.losses++;
  }
 }
 return [...rows.values()].sort((a,b)=>b.points-a.points||(b.goalsFor-b.goalsAgainst)-(a.goalsFor-a.goalsAgainst)||String(a.teamId).localeCompare(String(b.teamId)));
}
function runExperimentalSeasonBatch(state,schedule,seed) {
 assertSeed(seed);assertSchedule(schedule);
 const before=JSON.stringify(state);
 const games=schedule.map((g,i)=>createExperimentalGameOutcome(applyExperimentalShootout(applyExperimentalOvertime(simulateExperimentalGame(state,g,deriveGameSeed(seed,i))))));
 const blocked=games.filter(g=>!g.researchReady);
 const teamIds=[...new Set(schedule.flatMap(g=>[g.homeTeamId,g.awayTeamId]))];
 const standings=blocked.length?null:createExperimentalStandings(games,teamIds);
 if(JSON.stringify(state)!==before) throw new Error('Source state mutation detected');
 return {kind:'experimental-season-batch',version:1,seed,gameCount:games.length,researchReady:blocked.length===0,blockers:[...new Set(blocked.flatMap(g=>g.blockers))],games,standings,official:false,gameResultCreated:false,standingsUpdated:false,sourceStateMutated:false,persistencePerformed:false};
}
module.exports={MAX_GAMES,deriveGameSeed,createExperimentalSchedule,simulateExperimentalGame,applyExperimentalOvertime,applyExperimentalShootout,createExperimentalGameOutcome,createExperimentalStandings,runExperimentalSeasonBatch};
