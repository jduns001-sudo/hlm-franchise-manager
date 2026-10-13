'use strict';
/** Isolated deterministic playoff laboratory; no official games, standings or persistence. */
const { simulateExperimentalGame,applyExperimentalOvertime,applyExperimentalShootout,createExperimentalGameOutcome,deriveGameSeed }=require('./hlm-experimental-season-batch');
const { experimentalPlayoffSeeds }=require('./hlm-experimental-season-analysis');
function validateSeriesTeams(homeTeamId,awayTeamId,bestOf) {
 if(homeTeamId==null||awayTeamId==null||homeTeamId===awayTeamId)throw new TypeError('Distinct teams required');
 if(![1,3,5,7].includes(bestOf))throw new RangeError('Series length must be odd, 1-7');
}
function buildExperimentalBracket(seeds) {
 if(!Array.isArray(seeds)||seeds.length<2||seeds.length>8||(seeds.length&(seeds.length-1))!==0)throw new RangeError('Bracket requires 2, 4, or 8 seeds');
 const ids=seeds.map(s=>s.teamId);
 if(ids.some(id=>id==null)||new Set(ids).size!==ids.length)throw new TypeError('Duplicate or missing team');
 return seeds.slice(0,seeds.length/2).map((top,i)=>({seriesId:i+1,higherSeedTeamId:top.teamId,lowerSeedTeamId:seeds[seeds.length-1-i].teamId}));
}
function playoffHomeTeam(index,higherSeedTeamId,lowerSeedTeamId) {
 if(!Number.isSafeInteger(index)||index<0||index>6)throw new RangeError('Invalid game index');
 return [0,1,4,6].includes(index)?higherSeedTeamId:lowerSeedTeamId;
}
function simulateExperimentalPlayoffSeries(state,higherSeedTeamId,lowerSeedTeamId,seed,bestOf=7) {
 validateSeriesTeams(higherSeedTeamId,lowerSeedTeamId,bestOf);
 const needed=(bestOf+1)/2, wins={[String(higherSeedTeamId)]:0,[String(lowerSeedTeamId)]:0},games=[],blockers=[];
 for(let i=0;i<bestOf;i++){
  if(wins[String(higherSeedTeamId)]>=needed||wins[String(lowerSeedTeamId)]>=needed)break;
  const homeTeamId=playoffHomeTeam(i,higherSeedTeamId,lowerSeedTeamId);
  const awayTeamId=homeTeamId===higherSeedTeamId?lowerSeedTeamId:higherSeedTeamId;
  const game=createExperimentalGameOutcome(applyExperimentalShootout(applyExperimentalOvertime(simulateExperimentalGame(state,{id:i+1,homeTeamId,awayTeamId},deriveGameSeed(seed,i)))));
  games.push(game);
  if(!game.researchReady||!game.outcome){blockers.push(...game.blockers);break;}
  wins[String(game.outcome.winnerTeamId)]++;
 }
 const ready=blockers.length===0&&games.length>0&&games.every(g=>g.researchReady);
 const winner=ready?(wins[String(higherSeedTeamId)]>=needed?higherSeedTeamId:wins[String(lowerSeedTeamId)]>=needed?lowerSeedTeamId:null):null;
 return {kind:'experimental-playoff-series',version:1,bestOf,higherSeedTeamId,lowerSeedTeamId,seed,researchReady:ready,blockers:[...new Set(blockers)],games,wins,winnerTeamId:winner,official:false,persistencePerformed:false,sourceStateMutated:false};
}
function playoffSeriesAudit(series) {
 if(!series||series.kind!=='experimental-playoff-series')throw new TypeError('Invalid series');
 const wins={[String(series.higherSeedTeamId)]:0,[String(series.lowerSeedTeamId)]:0};
 for(const game of series.games) {
  if(!game.outcome)continue;
  const id=String(game.outcome.winnerTeamId);
  if(!(id in wins))throw new Error('Unexpected series winner');
  wins[id]++;
 }
 return {consistent:Object.keys(wins).every(id=>wins[id]===series.wins[id]),countedGames:Object.values(wins).reduce((a,b)=>a+b,0),official:false};
}
function playoffSeriesSummary(series) {
 const audit=playoffSeriesAudit(series);
 if(!audit.consistent)throw new Error('Inconsistent experimental playoff series');
 return {higherSeedTeamId:series.higherSeedTeamId,lowerSeedTeamId:series.lowerSeedTeamId,gamesPlayed:series.games.length,wins:{...series.wins},winnerTeamId:series.winnerTeamId,researchReady:series.researchReady,official:false};
}
function createExperimentalPlayoffPreview(batch,count=4) {
 const seeds=experimentalPlayoffSeeds(batch,count);
 return {kind:'experimental-playoff-preview',seeds,firstRound:buildExperimentalBracket(seeds),official:false};
}
function runExperimentalPlayoffRound(state,bracket,seed,bestOf=7) {
 if(!Array.isArray(bracket)||bracket.length<1||bracket.length>4)throw new RangeError('Invalid bracket');
 const series=bracket.map((pair,i)=>simulateExperimentalPlayoffSeries(state,pair.higherSeedTeamId,pair.lowerSeedTeamId,deriveGameSeed(seed,i),bestOf));
 const ready=series.every(s=>s.researchReady&&s.winnerTeamId!=null);
 return {kind:'experimental-playoff-round',researchReady:ready,series,winners:ready?series.map(s=>s.winnerTeamId):null,blockers:[...new Set(series.flatMap(s=>s.blockers))],official:false,persistencePerformed:false};
}
module.exports={validateSeriesTeams,buildExperimentalBracket,playoffHomeTeam,simulateExperimentalPlayoffSeries,playoffSeriesAudit,playoffSeriesSummary,createExperimentalPlayoffPreview,runExperimentalPlayoffRound};
