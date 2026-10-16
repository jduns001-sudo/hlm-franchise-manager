/* Experimental performance comparison insights browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-performance-history-comparisons')return global.HLMPhase11PerformanceHistoryComparisons;throw Error('Unsupported module')};
'use strict';
/* Deterministic descriptive interpretation of isolated simulated comparison periods. */
const {summarizePerformanceHistoryComparisons}=require('./hlm-phase11-performance-history-comparisons');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
function interpretPair(pair){
 if(!pair||typeof pair!=='object'||typeof pair.sampleEligible!=='boolean')throw TypeError('A historical comparison pair is required');
 const direction=n=>n>0?'left-higher-observed':n<0?'right-higher-observed':'equal-observed';
 const eligible=pair.sampleEligible;
 const signals=[pair.leftPersistentSignal,pair.rightPersistentSignal];
 const trendContext=signals.every(s=>s===null)?'no-persistent-observed-trend':
  signals[0]===signals[1]?'matching-persistent-observed-trend':'different-persistent-observed-trends';
 return {left:pair.left,right:pair.right,sampleEligible:eligible,
  evidenceTier:eligible?'comparable-periods':'insufficient-period-evidence',
  observedShotsDirection:eligible?direction(pair.shotsDifference):'not-comparable',
  observedGoalsDirection:eligible?direction(pair.goalsDifference):'not-comparable',
  observedExpectedGoalsDirection:eligible?direction(pair.expectedGoalsDifference):'not-comparable',
  observedFinishingGapDirection:eligible?direction(pair.observedFinishingGapDifference):'not-comparable',
  trendContext:eligible?trendContext:'insufficient-period-evidence',
  stabilityChangeDirection:!eligible||pair.stabilityChangeDifference===null?'not-comparable':direction(pair.stabilityChangeDifference),
  shotsDifference:pair.shotsDifference,goalsDifference:pair.goalsDifference,
  expectedGoalsDifference:pair.expectedGoalsDifference,
  observedFinishingGapDifference:pair.observedFinishingGapDifference,
  descriptiveOnly:true,notPredictive:true,notScoutingGrade:true,notDecisionAdvice:true};
}
function summarizePerformanceComparisonInsights(homeLineup,awayLineup,options={}){
 const base=summarizePerformanceHistoryComparisons(homeLineup,awayLineup,options);
 const playerPairInsights=base.playerPairs.map(interpretPair);
 const teamPairInsight=interpretPair(base.teamPair);
 const evidenceCounts={comparable:playerPairInsights.filter(p=>p.sampleEligible).length,
  insufficient:playerPairInsights.filter(p=>!p.sampleEligible).length};
 if(evidenceCounts.comparable+evidenceCounts.insufficient!==base.playerPairs.length)
  throw Error('Comparison insight evidence coverage mismatch');
 for(const side of ['home','away']){
  const members=base.players.filter(p=>p.team===side).map(p=>p.insight),t=base.teams[side].insight;
  if(sum(members,'shots')!==t.shots||sum(members,'goals')!==t.goals||
   Math.abs(sum(members,'expectedGoals')-t.expectedGoals)>members.length*0.000002+0.000001)
   throw Error('Comparison insight statistical conservation mismatch');
 }
 if(new Set(base.players.map(p=>p.team+':'+p.playerId)).size!==base.players.length)
  throw Error('Comparison insight duplicate player identity');
 const home=base.teams.home.insight,away=base.teams.away.insight;
 if(teamPairInsight.shotsDifference!==home.shots-away.shots||
  teamPairInsight.goalsDifference!==home.goals-away.goals||
  Math.abs(teamPairInsight.expectedGoalsDifference-round(home.expectedGoals-away.expectedGoals))>0.000002)
  throw Error('Comparison insight team pair conservation mismatch');
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,periodCount:base.periodCount,gamesPerPeriod:base.gamesPerPeriod,totalGames:base.totalGames,
  players:base.players,teams:base.teams,playerPairInsights,teamPairInsight,evidenceCounts,
  summaryModel:'experimental-performance-comparison-insights-v1',
  interpretation:'descriptive-sample-aware-pairwise-simulated-period-comparisons-not-franchise-history-or-prediction'};
}
module.exports={summarizePerformanceComparisonInsights,interpretPair};

global.HLMPhase11PerformanceComparisonInsights=module.exports;
})(typeof window!=='undefined'?window:globalThis);
