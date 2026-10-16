'use strict';
/* Read-only deterministic finishing performance from existing shot-danger data. */
const {summarizeShotDanger}=require('./hlm-phase11-shot-danger');
const round=n=>Number(n.toFixed(6));
const tierNames=['low','medium','high'];
const sum=(items,key)=>items.reduce((n,item)=>n+item[key],0);
const pct=(goals,shots)=>shots?round(goals/shots):null;
function summarizeFinishingTrends(homeLineup,awayLineup,options={}){
 const danger=summarizeShotDanger(homeLineup,awayLineup,options);
 const periodRow=(shots,goals,expectedGoals,period)=>({period,shots,goals,expectedGoals:round(expectedGoals),shootingPercentage:pct(goals,shots),goalsAboveExpected:round(goals-expectedGoals)});
 const tierEfficiency=tiers=>Object.fromEntries(tierNames.map(t=>{const v=tiers[t];return [t,{shots:v.shots,goals:v.goals,expectedGoals:v.expectedGoals,shootingPercentage:pct(v.goals,v.shots),goalsAboveExpected:round(v.goals-v.expectedGoals)}]}));
 const players=danger.players.map(p=>{
  const periods=p.periodTiers.map((tiers,i)=>periodRow(sum(tierNames.map(t=>tiers[t]),'shots'),sum(tierNames.map(t=>tiers[t]),'goals'),sum(tierNames.map(t=>tiers[t]),'expectedGoals'),i+1));
  return {team:p.team,playerId:p.playerId,shots:p.shots,goals:p.goals,expectedGoals:p.expectedGoals,
   shootingPercentage:pct(p.goals,p.shots),goalsAboveExpected:round(p.goals-p.expectedGoals),
   dangerEfficiency:tierEfficiency(p.tiers),periodTrends:periods};
 });
 const teams={};
 for(const team of ['home','away']){
  const members=players.filter(p=>p.team===team);
  const periods=danger.periodSummaries.map(p=>periodRow(p[team+'Shots'],p[team+'Goals'],p[team+'ExpectedGoals'],p.period));
  teams[team]={shots:danger[team+'Shots'],goals:danger[team+'Score'],expectedGoals:danger[team+'ExpectedGoals'],
   shootingPercentage:pct(danger[team+'Score'],danger[team+'Shots']),
   goalsAboveExpected:round(danger[team+'Score']-danger[team+'ExpectedGoals']),
   dangerEfficiency:tierEfficiency(danger.teams[team]),periodTrends:periods};
  if(sum(members,'shots')!==teams[team].shots||sum(members,'goals')!==teams[team].goals||
    Math.abs(sum(members,'expectedGoals')-teams[team].expectedGoals)>0.000005)throw Error('Finishing team conservation mismatch');
  for(let i=0;i<danger.periods;i++){
   const rows=members.map(p=>p.periodTrends[i]),expected=periods[i];
   if(sum(rows,'shots')!==expected.shots||sum(rows,'goals')!==expected.goals||
      Math.abs(sum(rows,'expectedGoals')-expected.expectedGoals)>members.length*0.000001+0.000001)throw Error('Finishing period conservation mismatch');
  }
  for(const tier of tierNames){
   const rows=members.map(p=>p.dangerEfficiency[tier]),expected=teams[team].dangerEfficiency[tier];
   if(sum(rows,'shots')!==expected.shots||sum(rows,'goals')!==expected.goals||
      Math.abs(sum(rows,'expectedGoals')-expected.expectedGoals)>members.length*0.000001+0.000001)throw Error('Finishing tier conservation mismatch');
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
 seed:danger.seed,periods:danger.periods,thresholds:danger.thresholds,teams,players,summaryModel:'experimental-finishing-trends-v1'};
}
module.exports={summarizeFinishingTrends};
