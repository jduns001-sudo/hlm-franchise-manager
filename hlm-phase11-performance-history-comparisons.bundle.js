/* Experimental performance history comparisons browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-performance-history-insights')return global.HLMPhase11PerformanceHistoryInsights;throw Error('Unsupported module')};
'use strict';
/* Read-only pairwise historical comparisons; descriptive, not rankings or recommendations. */
const {summarizePerformanceHistoryInsights}=require('./hlm-phase11-performance-history-insights');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
function compare(left,right){
 if(!left||!right||!left.insight||!right.insight)throw TypeError('Two historical insight records required');
 const a=left.insight,b=right.insight;
 const sampleEligible=a.sampleEligible&&b.sampleEligible;
 const gap=key=>round(a[key]-b[key]);
 return {left:{team:left.team||'home',playerId:left.playerId||null},
  right:{team:right.team||'away',playerId:right.playerId||null},
  sampleEligible,evidenceTier:sampleEligible?'comparable-periods':'insufficient-period-evidence',
  shotsDifference:gap('shots'),goalsDifference:gap('goals'),
  expectedGoalsDifference:gap('expectedGoals'),
  observedFinishingGapDifference:round((a.goals-a.expectedGoals)-(b.goals-b.expectedGoals)),
  stabilityChangeDifference:a.stabilityDelta===null||b.stabilityDelta===null?null:gap('stabilityDelta'),
  leftLatestSignal:a.latestSignal,rightLatestSignal:b.latestSignal,
  leftPersistentSignal:a.persistentDirectionalSignal,rightPersistentSignal:b.persistentDirectionalSignal,
  descriptiveOnly:true,notPredictive:true,notScoutingGrade:true,notDecisionAdvice:true};
}
function summarizePerformanceHistoryComparisons(homeLineup,awayLineup,options={}){
 const base=summarizePerformanceHistoryInsights(homeLineup,awayLineup,options);
 const players=base.players,teams=base.teams;
 const playerPairs=[];
 for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){
  const a=players[i],b=players[j];
  playerPairs.push(compare(a,b));
 }
 const teamPair=compare({...teams.home,team:'home'},{...teams.away,team:'away'});
 const comparisons=base.comparisons;
 for(const side of ['home','away']){
  const rows=players.filter(p=>p.team===side).map(p=>p.insight),t=teams[side].insight;
  if(sum(rows,'shots')!==t.shots||sum(rows,'goals')!==t.goals||
   Math.abs(sum(rows,'expectedGoals')-t.expectedGoals)>rows.length*0.000002+0.000001)
   throw Error('History comparisons team conservation mismatch');
 }
 if(new Set(players.map(p=>p.team+':'+p.playerId)).size!==players.length)throw Error('History comparisons duplicate player identity');
 if(playerPairs.length!==players.length*(players.length-1)/2)throw Error('History comparisons pair coverage mismatch');
 const homeTotals=teams.home.insight,awayTotals=teams.away.insight;
 if(teamPair.shotsDifference!==homeTotals.shots-awayTotals.shots||
  teamPair.goalsDifference!==homeTotals.goals-awayTotals.goals||
  Math.abs(teamPair.expectedGoalsDifference-(homeTotals.expectedGoals-awayTotals.expectedGoals))>0.000002)
  throw Error('History comparisons pair conservation mismatch');
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,periodCount:base.periodCount,gamesPerPeriod:base.gamesPerPeriod,totalGames:base.totalGames,
  players,teams,comparisons,playerPairs,teamPair,
  summaryModel:'experimental-performance-history-comparisons-v1',
  interpretation:'pairwise-descriptive-independent-simulated-periods-not-actual-franchise-history-or-prediction'};
}
module.exports={summarizePerformanceHistoryComparisons,compare};

global.HLMPhase11PerformanceHistoryComparisons=module.exports;
})(typeof window!=='undefined'?window:globalThis);
