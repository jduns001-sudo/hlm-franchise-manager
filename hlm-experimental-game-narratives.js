'use strict';
/** Research-only period summaries; never alters official game results or saves. */
const {createExperimentalLeadChanges}=require('./hlm-experimental-lead-changes');
function createExperimentalGameNarratives(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalLeadChanges(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-game-narratives',researchReady:false,blockers:base.blockers,periods:null,teams:null,official:false,persistencePerformed:false};
 const periods=base.periods.map(p=>{
  const leader=p.leader;
  const shotLeader=p.homeShots>p.awayShots?'home':p.awayShots>p.homeShots?'away':'even';
  const scoreLabel=leader==='tied'?'tied':leader+' leads';
  const goalLabel=p.homeGoals===p.awayGoals?'even goals':p.homeGoals>p.awayGoals?'home outscored away':'away outscored home';
  const shotLabel=shotLeader==='even'?'shots even':shotLeader+' led shots';
  return {period:p.period,kind:p.kind,score:{home:p.cumulativeHomeGoals,away:p.cumulativeAwayGoals},shots:{home:p.homeShots,away:p.awayShots},leader,shotLeader,scoreLabel,goalLabel,shotLabel,closeGame:p.closeGame,leadChanges:p.cumulativeLeadChanges};
 });
 const final=periods.at(-1),teams={home:{...base.teams.home},away:{...base.teams.away}};
 const valid=base.audit.consistent&&Boolean(final)&&final.score.home===teams.home.goals&&final.score.away===teams.away.goals&&periods.every(p=>['home','away','tied'].includes(p.leader)&&['home','away','even'].includes(p.shotLeader)&&Number.isInteger(p.score.home)&&Number.isInteger(p.score.away));
 if(!valid)throw new Error('EXPERIMENTAL_GAME_NARRATIVES_AUDIT_FAILED');
 return {kind:'experimental-game-narratives',researchReady:true,periods,teams,summary:{...base.summary,finalScore:{home:teams.home.goals,away:teams.away.goals}},audit:{consistent:true,periodsChecked:periods.length},narrativeMode:'synthetic-period-facts',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalGameNarratives};
