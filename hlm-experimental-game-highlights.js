'use strict';
/** Deterministic highlights of synthetic period facts, never authoritative events. */
const {createExperimentalGameNarratives}=require('./hlm-experimental-game-narratives');
function createExperimentalGameHighlights(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalGameNarratives(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-game-highlights',researchReady:false,blockers:base.blockers,highlights:null,teams:null,official:false,persistencePerformed:false};
 const highlights=[];
 for(const p of base.periods){
  const totalGoals=p.score.home+p.score.away;
  if(p.shots.home+p.shots.away>0)highlights.push({period:p.period,type:'shot-summary',description:p.shotLabel,homeShots:p.shots.home,awayShots:p.shots.away});
  if(p.leader!=='tied')highlights.push({period:p.period,type:'score-leader',description:p.scoreLabel,score:{...p.score}});
  if(p.closeGame)highlights.push({period:p.period,type:'close-score',description:'Within one goal after period',score:{...p.score}});
  if(p.leadChanges>0)highlights.push({period:p.period,type:'lead-history',description:'Lead changes through period: '+p.leadChanges,count:p.leadChanges});
 }
 const teams={home:{...base.teams.home},away:{...base.teams.away}};
 const final=base.periods.at(-1);
 const valid=base.audit.consistent&&Boolean(final)&&final.score.home===teams.home.goals&&final.score.away===teams.away.goals&&highlights.every(h=>Number.isInteger(h.period)&&h.period>=1&&['shot-summary','score-leader','close-score','lead-history'].includes(h.type));
 if(!valid)throw new Error('EXPERIMENTAL_GAME_HIGHLIGHTS_AUDIT_FAILED');
 return {kind:'experimental-game-highlights',researchReady:true,highlights,periods:base.periods.map(p=>({...p,score:{...p.score},shots:{...p.shots}})),teams,summary:{...base.summary,highlightCount:highlights.length},audit:{consistent:true,highlightsChecked:highlights.length},highlightMode:'synthetic-period-facts',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalGameHighlights};
