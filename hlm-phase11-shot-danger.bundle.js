/* Experimental player shot-danger analytics browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-goalie-period-stats')return global.HLMPhase11GoaliePeriodStats;if(path==='./hlm-phase11-player-xg')return global.HLMPhase11PlayerXG;throw Error('Unsupported module')};
'use strict';
/* Experimental read-only shot danger tiers derived from seeded goal probabilities. */
const {summarizeGoaliePeriod}=require('./hlm-phase11-goalie-period-stats');
const {summarizePlayerXG}=require('./hlm-phase11-player-xg');
const round=n=>Number(n.toFixed(6));
const tiers=['low','medium','high'];
const tierFor=p=>p<0.08?'low':p<0.16?'medium':'high';
const empty=()=>({shots:0,goals:0,expectedGoals:0});
function summarizeShotDanger(homeLineup,awayLineup,options={}){
 const {homeGoalie=null,awayGoalie=null,periodSeconds=1200,shiftSeconds=45,seed=11}=options;
 const baseline=summarizePlayerXG(homeLineup,awayLineup,options);
 const rows=new Map(baseline.players.map(p=>[p.team+':'+p.playerId,{...p,tiers:Object.fromEntries(tiers.map(t=>[t,empty()])),periodTiers:Array.from({length:baseline.periods},()=>Object.fromEntries(tiers.map(t=>[t,empty()])))}]));
 const periods=baseline.periodSummaries.map(p=>({...p,homeTiers:Object.fromEntries(tiers.map(t=>[t,empty()])),awayTiers:Object.fromEntries(tiers.map(t=>[t,empty()]))}));
 const teamTiers={home:Object.fromEntries(tiers.map(t=>[t,empty()])),away:Object.fromEntries(tiers.map(t=>[t,empty()]))};
 const accumulate=(entry,goal,p)=>{entry.shots++;entry.goals+=goal;entry.expectedGoals+=p};
 for(let period=0;period<baseline.periods;period++){
  for(const side of [{team:'home',lineup:homeLineup,goalie:awayGoalie,offset:0},{team:'away',lineup:awayLineup,goalie:homeGoalie,offset:1000003}]){
   const report=summarizeGoaliePeriod(side.lineup,{goalie:side.goalie,periodSeconds,shiftSeconds,seed:seed+side.offset+period});
   for(const event of report.periodEvents){
    const row=rows.get(side.team+':'+String(event.shooterId));
    if(!row)throw new Error('Unrecognized shooter in danger distribution: '+event.shooterId);
    const probability=event.goalProbability;
    if(!Number.isFinite(probability)||probability<0||probability>1)throw new Error('Invalid shot probability');
    const tier=tierFor(probability),goal=event.outcome==='goal'?1:0;
    accumulate(row.tiers[tier],goal,probability);
    accumulate(row.periodTiers[period][tier],goal,probability);
    accumulate(periods[period][side.team+'Tiers'][tier],goal,probability);
    accumulate(teamTiers[side.team][tier],goal,probability);
   }
  }
 }
 const finalize=group=>Object.fromEntries(tiers.map(t=>{const d=group[t];return [t,{shots:d.shots,goals:d.goals,expectedGoals:round(d.expectedGoals),shootingPercentage:d.shots?round(d.goals/d.shots):null,goalsAboveExpected:round(d.goals-d.expectedGoals)}]}));
 const players=[...rows.values()].map(p=>({...p,tiers:finalize(p.tiers),periodTiers:p.periodTiers.map(finalize)})).sort((a,b)=>a.team.localeCompare(b.team)||a.playerId.localeCompare(b.playerId));
 const periodSummaries=periods.map(p=>({...p,homeTiers:finalize(p.homeTiers),awayTiers:finalize(p.awayTiers)}));
 const teams={home:finalize(teamTiers.home),away:finalize(teamTiers.away)};
 const sum=(group,field)=>tiers.reduce((n,t)=>n+group[t][field],0);
 for(const team of ['home','away']){
  const members=players.filter(p=>p.team===team),group=teams[team];
  if(sum(group,'shots')!==baseline[team+'Shots']||sum(group,'goals')!==baseline[team+'Score']||
   Math.abs(sum(group,'expectedGoals')-baseline[team+'ExpectedGoals'])>0.000005)throw Error('Team danger conservation mismatch');
  for(const p of members){
   if(sum(p.tiers,'shots')!==p.shots||sum(p.tiers,'goals')!==p.goals||
    Math.abs(sum(p.tiers,'expectedGoals')-p.expectedGoals)>0.000005)throw Error('Player danger conservation mismatch');
  }
  for(const period of periodSummaries){
   const grouped=period[team+'Tiers'];
   if(sum(grouped,'shots')!==period[team+'Shots']||sum(grouped,'goals')!==period[team+'Goals']||
    Math.abs(sum(grouped,'expectedGoals')-period[team+'ExpectedGoals'])>0.000005)throw Error('Period danger conservation mismatch');
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed,periods:baseline.periods,thresholds:{lowBelow:0.08,highFrom:0.16},homeScore:baseline.homeScore,awayScore:baseline.awayScore,
  homeShots:baseline.homeShots,awayShots:baseline.awayShots,homeExpectedGoals:baseline.homeExpectedGoals,awayExpectedGoals:baseline.awayExpectedGoals,
  teams,players,periodSummaries,summaryModel:'experimental-shot-danger-v1'};
}
module.exports={summarizeShotDanger,tierFor};

global.HLMPhase11ShotDanger=module.exports;
})(typeof window!=='undefined'?window:globalThis);
