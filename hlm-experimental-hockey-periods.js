'use strict';
/** Research-only period-level score model with deterministic overtime. */
const {createExperimentalSimulationDryRun}=require('./hlm-phase10-experimental-simulation-dry-run');
const {deriveGameSeed}=require('./hlm-experimental-season-batch');
function nextRandom(seed){let x=seed>>>0;return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return (x+0.5)/4294967296;};}
function splitGoals(total,next){
 if(!Number.isSafeInteger(total)||total<0||total>100)throw new RangeError('Invalid goal count');
 const periods=[0,0,0];for(let i=0;i<total;i++)periods[Math.floor(next()*3)]++;
 return periods;
}
function regulationPeriods(score,seed){
 if(!score||!Number.isSafeInteger(score.home)||!Number.isSafeInteger(score.away)||score.home<0||score.away<0)throw new TypeError('Invalid score');
 const next=nextRandom(seed);
 const h=splitGoals(score.home,next),a=splitGoals(score.away,next);
 return h.map((home,i)=>({period:i+1,home,away:a[i],kind:'regulation'}));
}
function overtimeWinner(homeTeamId,awayTeamId,seed){
 const next=nextRandom(seed);return next()<0.5?homeTeamId:awayTeamId;
}
function resolveExperimentalRegulation(game,playoff=false){
 if(!game.researchReady||!game.hypotheticalScore)return {...game,periods:null,resolution:null};
 const {home,away}=game.hypotheticalScore;
 const periods=regulationPeriods(game.hypotheticalScore,game.seed);
 if(home!==away)return {...game,periods,resolution:{winnerTeamId:home>away?game.homeTeamId:game.awayTeamId,method:'regulation',overtimePeriods:0,shootout:false,official:false}};
 const winnerTeamId=overtimeWinner(game.homeTeamId,game.awayTeamId,deriveGameSeed(game.seed,1));
 const ot={period:4,home:winnerTeamId===game.homeTeamId?1:0,away:winnerTeamId===game.awayTeamId?1:0,kind:playoff?'playoff-overtime':'regular-season-overtime'};
 return {...game,periods:[...periods,ot],resolution:{winnerTeamId,method:ot.kind,overtimePeriods:1,shootout:false,official:false}};
}
function simulateExperimentalHockeyGame(state,homeTeamId,awayTeamId,seed,playoff=false){
 const run=createExperimentalSimulationDryRun(state,homeTeamId,awayTeamId,seed);
 const game={homeTeamId,awayTeamId,seed,researchReady:run.researchReady,blockers:run.blockers.slice(),hypotheticalScore:run.hypotheticalScore?{...run.hypotheticalScore}:null,official:false};
 return resolveExperimentalRegulation(game,playoff);
}
function periodBoxScore(game){
 if(!game.periods||!game.resolution)return null;
 const totals=game.periods.reduce((acc,p)=>({home:acc.home+p.home,away:acc.away+p.away}),{home:0,away:0});
 return {periods:game.periods.map(p=>({...p})),totals,winnerTeamId:game.resolution.winnerTeamId,method:game.resolution.method,official:false};
}
function validatePeriodScore(game){
 if(!game.researchReady||!game.periods)return {valid:false,reason:'NOT_READY'};
 const regulation=game.periods.filter(p=>p.kind==='regulation');
 const home=regulation.reduce((sum,p)=>sum+p.home,0),away=regulation.reduce((sum,p)=>sum+p.away,0);
 const overtime=game.periods.filter(p=>p.kind!=='regulation');
 const valid=regulation.length===3&&home===game.hypotheticalScore.home&&away===game.hypotheticalScore.away&&
 (home===away?overtime.length===1&&overtime[0].home+overtime[0].away===1:overtime.length===0);
 return {valid,regulationHome:home,regulationAway:away,overtimePeriods:overtime.length,official:false};
}
function simulateExperimentalHockeySeries(state,higherSeedTeamId,lowerSeedTeamId,seed,bestOf=7){
 if(![1,3,5,7].includes(bestOf)||higherSeedTeamId===lowerSeedTeamId)throw new RangeError('Invalid series');
 const needed=(bestOf+1)/2,wins={[String(higherSeedTeamId)]:0,[String(lowerSeedTeamId)]:0},games=[];
 for(let i=0;i<bestOf;i++){
  if(wins[String(higherSeedTeamId)]>=needed||wins[String(lowerSeedTeamId)]>=needed)break;
  const homeTeamId=[0,1,4,6].includes(i)?higherSeedTeamId:lowerSeedTeamId;
  const awayTeamId=homeTeamId===higherSeedTeamId?lowerSeedTeamId:higherSeedTeamId;
  const game=simulateExperimentalHockeyGame(state,homeTeamId,awayTeamId,deriveGameSeed(seed,i),true);
  games.push(game);if(!game.researchReady)break;
  wins[String(game.resolution.winnerTeamId)]++;
 }
 const ready=games.length>0&&games.every(g=>g.researchReady);
 const winnerTeamId=ready?(wins[String(higherSeedTeamId)]>=needed?higherSeedTeamId:wins[String(lowerSeedTeamId)]>=needed?lowerSeedTeamId:null):null;
 return {kind:'experimental-hockey-series',researchReady:ready,games,wins,winnerTeamId,official:false,persistencePerformed:false};
}
module.exports={nextRandom,splitGoals,regulationPeriods,overtimeWinner,resolveExperimentalRegulation,simulateExperimentalHockeyGame,periodBoxScore,validatePeriodScore,simulateExperimentalHockeySeries};
