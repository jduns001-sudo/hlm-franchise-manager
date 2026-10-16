'use strict';
/* Experimental read-only goal event timeline derived from the same seeded period reports. */
const {summarizeGoaliePeriod}=require('./hlm-phase11-goalie-period-stats');
const {summarizeTeamGame}=require('./hlm-phase11-team-game-shots');
function summarizeGoalTimeline(homeLineup,awayLineup,{homeGoalie=null,awayGoalie=null,periods=3,periodSeconds=1200,shiftSeconds=45,seed=11}={}){
 const options={homeGoalie,awayGoalie,periods,periodSeconds,shiftSeconds,seed};
 const game=summarizeTeamGame(homeLineup,awayLineup,options);
 const events=[];
 for(let index=0;index<periods;index++){
  const sides=[
   {team:'home',lineup:homeLineup,goalie:awayGoalie,periodSeed:seed+index},
   {team:'away',lineup:awayLineup,goalie:homeGoalie,periodSeed:seed+1000003+index}
  ];
  for(const side of sides){
   const report=summarizeGoaliePeriod(side.lineup,{goalie:side.goalie,periodSeconds,shiftSeconds,seed:side.periodSeed});
   for(const event of report.periodEvents){
    if(event.outcome!=='goal')continue;
    if(!Number.isFinite(event.second)||event.second<0||event.second>=periodSeconds)throw Error('Invalid goal clock');
    events.push({period:index+1,second:event.second,gameSecond:index*periodSeconds+event.second,
     scoringTeam:side.team,scorerId:event.shooterId,goalProbability:event.goalProbability});
   }
  }
 }
 events.sort((a,b)=>a.gameSecond-b.gameSecond||(a.scoringTeam==='home'?-1:1)||String(a.scorerId).localeCompare(String(b.scorerId)));
 let homeScore=0,awayScore=0;
 const timeline=events.map((event,index)=>{
  if(event.scoringTeam==='home')homeScore++;else awayScore++;
  const remaining=periodSeconds-event.second;
  const gameClock=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
  return {...event,sequence:index+1,gameClock,homeScore,awayScore};
 });
 if(homeScore!==game.home.goalsFor||awayScore!==game.away.goalsFor)throw Error('Goal timeline conservation mismatch');
 const periodSummaries=game.periodReports.map(p=>({
  period:p.period,homeGoals:p.home.goalsFor,awayGoals:p.away.goalsFor,
  homeShots:p.home.shotsFor,awayShots:p.away.shotsFor,
  homeExpectedGoals:p.home.expectedGoalsFor,awayExpectedGoals:p.away.expectedGoalsFor,
  goalEvents:timeline.filter(e=>e.period===p.period).length
 }));
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  seed,periods,periodSeconds,homeScore,awayScore,timeline,periodSummaries,
  home:game.home,away:game.away,summaryModel:'experimental-goal-timeline-v1'};
}
module.exports={summarizeGoalTimeline};
