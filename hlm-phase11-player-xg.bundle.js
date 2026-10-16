/* Experimental player expected-goals browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-goalie-period-stats')return global.HLMPhase11GoaliePeriodStats;if(path==='./hlm-phase11-player-shots')return global.HLMPhase11PlayerShots;if(path==='./hlm-phase11-team-game-shots')return global.HLMPhase11TeamGameShots;throw Error('Unsupported module')};
'use strict';
/* Read-only, experimental player expected goals from the canonical seeded shot outcomes. */
const {summarizeGoaliePeriod}=require('./hlm-phase11-goalie-period-stats');
const {summarizePlayerShots}=require('./hlm-phase11-player-shots');
const {summarizeTeamGame}=require('./hlm-phase11-team-game-shots');
const round=n=>Number(n.toFixed(6));
function summarizePlayerXG(homeLineup,awayLineup,options={}){
 const {homeGoalie=null,awayGoalie=null,periodSeconds=1200,shiftSeconds=45,seed=11}=options;
 const shots=summarizePlayerShots(homeLineup,awayLineup,options);
 const game=summarizeTeamGame(homeLineup,awayLineup,options);
 const rows=new Map(shots.players.map(p=>[p.team+':'+p.playerId,{...p,expectedGoals:0,periodExpectedGoals:Array(shots.periods).fill(0)}]));
 const periodSummaries=shots.periodSummaries.map(p=>({...p,homeExpectedGoals:0,awayExpectedGoals:0}));
 const exact={home:0,away:0};
 for(let period=0;period<shots.periods;period++){
  for(const side of [{team:'home',lineup:homeLineup,goalie:awayGoalie,offset:0},{team:'away',lineup:awayLineup,goalie:homeGoalie,offset:1000003}]){
   const report=summarizeGoaliePeriod(side.lineup,{goalie:side.goalie,periodSeconds,shiftSeconds,seed:seed+side.offset+period});
   let periodXG=0;
   for(const event of report.periodEvents){
    const row=rows.get(side.team+':'+String(event.shooterId));
    if(!row)throw new Error('Unknown shot-quality shooter: '+event.shooterId);
    if(!Number.isFinite(event.goalProbability)||event.goalProbability<0||event.goalProbability>1)throw new Error('Invalid goal probability');
    row.expectedGoals+=event.goalProbability;
    row.periodExpectedGoals[period]+=event.goalProbability;
    periodXG+=event.goalProbability;
   }
   exact[side.team]+=periodXG;
   periodSummaries[period][side.team+'ExpectedGoals']=round(periodXG);
  }
 }
 const players=[...rows.values()].map(p=>{
  const periodExpectedGoals=p.periodExpectedGoals.map(round);
  const expectedGoals=round(p.expectedGoals);
  return {...p,expectedGoals,periodExpectedGoals,goalsAboveExpected:round(p.goals-expectedGoals),
   expectedGoalsPerShot:p.shots?round(expectedGoals/p.shots):null};
 }).sort((a,b)=>a.team.localeCompare(b.team)||a.playerId.localeCompare(b.playerId));
 for(const team of ['home','away']){
  const side=game[team];
  const members=players.filter(p=>p.team===team);
  const total=members.reduce((n,p)=>n+p.expectedGoals,0);
  if(Math.abs(total-exact[team])>members.length*0.000001+0.000001||
     Math.abs(exact[team]-side.expectedGoalsFor)>shots.periods*0.000002+0.000001||
     members.reduce((n,p)=>n+p.shots,0)!==side.shotsFor||
     members.reduce((n,p)=>n+p.goals,0)!==side.goalsFor)throw new Error('Team xG conservation mismatch');
  for(const period of periodSummaries){
   const xg=members.reduce((n,p)=>n+p.periodExpectedGoals[period.period-1],0);
   const expected=game.periodReports[period.period-1][team].expectedGoalsFor;
   if(Math.abs(xg-expected)>members.length*0.000001+0.000002||
      Math.abs(period[team+'ExpectedGoals']-expected)>0.000002)throw new Error('Period xG conservation mismatch');
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed,periods:shots.periods,homeScore:shots.homeScore,awayScore:shots.awayScore,homeShots:shots.homeShots,awayShots:shots.awayShots,
  homeExpectedGoals:game.home.expectedGoalsFor,awayExpectedGoals:game.away.expectedGoalsFor,
  players,periodSummaries,summaryModel:'experimental-player-xg-v1'};
}
module.exports={summarizePlayerXG};

global.HLMPhase11PlayerXG=module.exports;
})(typeof window!=='undefined'?window:globalThis);
