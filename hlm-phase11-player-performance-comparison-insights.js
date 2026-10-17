'use strict';
/* Experimental read-only interpretation of seeded historical comparisons. */
const {summarizePerformanceHistoryComparisons}=require('./hlm-phase11-performance-history-comparisons');
const round=n=>Number(n.toFixed(6));
function interpret(record){
 const x=record.insight;
 const shots=Number(x.shots||0),goals=Number(x.goals||0),expectedGoals=Number(x.expectedGoals||0);
 const periods=Array.isArray(record.periods)?record.periods:[];
 const rates=periods.map(p=>Number(p.shots||0)).filter(Number.isFinite);
 const mean=rates.length?rates.reduce((a,b)=>a+b,0)/rates.length:0;
 const volatility=rates.length?Math.sqrt(rates.reduce((a,b)=>a+(b-mean)**2,0)/rates.length):null;
 const trend=rates.length>=2?round(rates[rates.length-1]-rates[0]):null;
 const eligible=Boolean(x.sampleEligible)&&shots>=10;
 return {team:record.team,playerId:record.playerId||null,sampleShots:shots,sampleGoals:goals,
  reliability:eligible?'sample-supported':'limited-sample',
  finishingConfidence:eligible?{observedRate:round(goals/shots),expectedRate:round(expectedGoals/shots),caution:'descriptive-not-predictive'}:null,
  volatility:volatility===null?null:round(volatility),rollingDirection:trend===null?'insufficient-periods':trend>0?'up':trend<0?'down':'flat',
  consistencyRank:null,rankExplanation:'No ordinal ranking across unequal or limited historical samples',
  latestSignal:x.latestSignal??null,persistentSignal:x.persistentDirectionalSignal??null,
  sampleAwareSummary:eligible?'Observed simulated sample; differences do not establish skill or future outcomes':'Limited sample; avoid comparative conclusions',
  descriptiveOnly:true,notPredictive:true,notDecisionAdvice:true};
}
function summarizePlayerPerformanceComparisonInsights(home,away,options={}){
 const base=summarizePerformanceHistoryComparisons(home,away,options);
 const players=base.players.map(interpret),teams={home:interpret({...base.teams.home,team:'home'}),away:interpret({...base.teams.away,team:'away'})};
 const comparisons=base.playerPairs.map(p=>({...p,interpretation:p.sampleEligible?'Descriptive difference across simulated periods, not a forecast':'Insufficient comparable period evidence'}));
 for(const side of ['home','away']){
  const members=players.filter(p=>p.team===side);
  if(members.reduce((n,p)=>n+p.sampleShots,0)!==teams[side].sampleShots||
     members.reduce((n,p)=>n+p.sampleGoals,0)!==teams[side].sampleGoals)throw Error('Performance insights conservation mismatch');
 }
 return {experimental:true,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed:base.seed,periodCount:base.periodCount,totalGames:base.totalGames,players,teams,comparisons,
  teamComparison:{...base.teamPair,interpretation:'Descriptive team comparison only; no automated GM actions'},
  interpretation:'Seeded experimental simulated history, not actual production franchise history'};
}
module.exports={interpret,summarizePlayerPerformanceComparisonInsights};
