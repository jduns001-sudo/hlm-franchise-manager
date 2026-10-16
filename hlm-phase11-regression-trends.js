'use strict';
/* Experimental read-only early/late finishing comparisons, not a forecast. */
const {summarizeRollingStreaks}=require('./hlm-phase11-rolling-streaks');
const round=n=>Number(n.toFixed(6));
const sum=(a,k)=>a.reduce((n,x)=>n+x[k],0);
const pct=(goals,shots)=>shots?round(goals/shots):null;
function segment(rows){
 const shots=sum(rows,'shots'),goals=sum(rows,'goals'),expectedGoals=round(sum(rows,'expectedGoals'));
 return {games:rows.length,shots,goals,expectedGoals,shootingPercentage:pct(goals,shots),goalsAboveExpected:round(goals-expectedGoals)};
}
function compare(trends){
 const earlyCount=Math.floor(trends.length/2);
 const early=segment(trends.slice(0,earlyCount)),late=segment(trends.slice(earlyCount));
 const shootingPercentageChange=early.shootingPercentage===null||late.shootingPercentage===null?null:round(late.shootingPercentage-early.shootingPercentage);
 const expectedGoalsChange=round(late.expectedGoals-late.games*(early.games?early.expectedGoals/early.games:0));
 const goalsAboveExpectedChange=round(late.goalsAboveExpected-late.games*(early.games?early.goalsAboveExpected/early.games:0));
 // Descriptive only: a change in finishing residuals is not evidence of predictive regression.
 const earlyResidualRate=early.games?early.goalsAboveExpected/early.games:0;
 const lateResidualRate=late.games?late.goalsAboveExpected/late.games:0;
 const towardZero=Math.abs(lateResidualRate)<Math.abs(earlyResidualRate)-0.000001;
 const crossesZero=earlyResidualRate*lateResidualRate<0;
 const regressionIndicator=early.games===0||late.games===0?'insufficient-data':Math.abs(earlyResidualRate)<0.000001?'stable-baseline':towardZero?'toward-expected':crossesZero?'past-expected':'away-from-expected';
 return {early,late,shootingPercentageChange,expectedGoalsChange,goalsAboveExpectedChange,regressionIndicator,descriptiveOnly:true};
}
function summarizeRegressionTrends(homeLineup,awayLineup,options={}){
 const base=summarizeRollingStreaks(homeLineup,awayLineup,options);
 const players=base.players.map(p=>({...p,comparison:compare(p.gameTrends)}));
 const teams={home:{...base.teams.home,comparison:compare(base.teams.home.gameTrends)},away:{...base.teams.away,comparison:compare(base.teams.away.gameTrends)}};
 for(const team of ['home','away']){
  const members=players.filter(p=>p.team===team);
  for(const part of ['early','late']){
   const t=teams[team].comparison[part],ps=members.map(p=>p.comparison[part]);
   if(sum(ps,'shots')!==t.shots||sum(ps,'goals')!==t.goals||
    Math.abs(sum(ps,'expectedGoals')-t.expectedGoals)>members.length*0.000001+0.000001)throw Error('Regression trend team conservation mismatch');
  }
  for(const p of members){
   const c=p.comparison;
   if(c.early.shots+c.late.shots!==p.shots||c.early.goals+c.late.goals!==p.goals||
    Math.abs(c.early.expectedGoals+c.late.expectedGoals-p.expectedGoals)>0.000003)throw Error('Regression trend player conservation mismatch');
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
 seed:base.seed,games:base.games,teams,players,summaryModel:'experimental-regression-trends-v1',interpretation:'descriptive-only-no-prediction'};
}
module.exports={summarizeRegressionTrends,compare,segment};
