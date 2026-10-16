/* Experimental performance volatility browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-finishing-confidence')return global.HLMPhase11FinishingConfidence;throw Error('Unsupported module')};
'use strict';
/* Experimental, deterministic descriptive game-to-game and rolling volatility. */
const {summarizeFinishingConfidence}=require('./hlm-phase11-finishing-confidence');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
function volatility(rows){
 const games=rows.length,shots=sum(rows,'shots'),goals=sum(rows,'goals'),expectedGoals=round(sum(rows,'expectedGoals'));
 const shooting=rows.filter(r=>r.shots>0).map(r=>r.goals/r.shots);
 const xgPerGame=rows.map(r=>r.expectedGoals);
 const variance=xs=>xs.length?round(xs.reduce((n,x)=>n+(x-xs.reduce((a,b)=>a+b,0)/xs.length)**2,0)/xs.length):null;
 const shootingVariance=variance(shooting),xgVariance=variance(xgPerGame);
 const shootingStdDev=shootingVariance===null?null:round(Math.sqrt(shootingVariance));
 const xgStdDev=xgVariance===null?null:round(Math.sqrt(xgVariance));
 const stabilityIndicator=shooting.length<3?'insufficient-shot-games':shootingStdDev<=0.1?'stable':shootingStdDev<=0.25?'variable':'highly-variable';
 return {games,shots,goals,expectedGoals,shootingGames:shooting.length,
  shootingPercentageVariance:shootingVariance,shootingPercentageStdDev:shootingStdDev,
  expectedGoalsPerGameVariance:xgVariance,expectedGoalsPerGameStdDev:xgStdDev,
  stabilityIndicator,descriptiveOnly:true,notPredictive:true};
}
function rollingVolatility(rows,size){
 return rows.map((_,i)=>i+1<size?null:{endingGame:i+1,games:size,...volatility(rows.slice(i+1-size,i+1))}).filter(Boolean);
}
function summarizePerformanceVolatility(homeLineup,awayLineup,options={}){
 const base=summarizeFinishingConfidence(homeLineup,awayLineup,options);
 const decorate=p=>({...p,volatility:volatility(p.gameTrends),rolling3Volatility:rollingVolatility(p.gameTrends,3),rolling5Volatility:rollingVolatility(p.gameTrends,5)});
 const players=base.players.map(decorate);
 const teams={home:decorate(base.teams.home),away:decorate(base.teams.away)};
 for(const team of ['home','away']){
  const members=players.filter(p=>p.team===team),t=teams[team];
  const check=(a,b)=>{if(sum(a,'shots')!==b.shots||sum(a,'goals')!==b.goals||
   Math.abs(sum(a,'expectedGoals')-b.expectedGoals)>a.length*0.000001+0.000001)throw Error('Performance volatility conservation mismatch')};
  check(members.map(p=>p.volatility),t.volatility);
  for(const size of [3,5]){
   const key='rolling'+size+'Volatility';
   for(const window of t[key]){
    const a=members.map(p=>p[key].find(w=>w.endingGame===window.endingGame));
    if(a.some(x=>!x))throw Error('Missing rolling player volatility');
    check(a,window);
   }
  }
  for(const p of members){
   if(p.volatility.shots!==p.shots||p.volatility.goals!==p.goals||
    Math.abs(p.volatility.expectedGoals-p.expectedGoals)>0.000003)throw Error('Player volatility conservation mismatch');
   for(const size of [3,5])for(const w of p['rolling'+size+'Volatility']){
    const slice=p.gameTrends.slice(w.endingGame-size,w.endingGame);
    if(sum(slice,'shots')!==w.shots||sum(slice,'goals')!==w.goals||
      Math.abs(sum(slice,'expectedGoals')-w.expectedGoals)>size*0.000001+0.000001)throw Error('Rolling player volatility conservation mismatch');
   }
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,games:base.games,teams,players,summaryModel:'experimental-performance-volatility-v1',
  interpretation:'descriptive-population-variance-per-game-and-shot-bearing-game-no-forecast'};
}
module.exports={summarizePerformanceVolatility,volatility,rollingVolatility};

global.HLMPhase11PerformanceVolatility=module.exports;
})(typeof window!=='undefined'?window:globalThis);
