'use strict';
/** Read-only synthetic game highlight consistency and presentation audit. */
const {createExperimentalGameHighlights}=require('./hlm-experimental-game-highlights');
function createExperimentalHighlightAudit(state,homeId,awayId,seed,playoff=false){
 const base=createExperimentalGameHighlights(state,homeId,awayId,seed,playoff);
 if(!base.researchReady)return {kind:'experimental-highlight-audit',researchReady:false,blockers:base.blockers,highlights:null,teams:null,official:false,persistencePerformed:false};
 const periodMap=new Map(base.periods.map(p=>[p.period,p]));
 const highlights=base.highlights.map((h,index)=>{
  const p=periodMap.get(h.period);
  if(!p)throw new Error('EXPERIMENTAL_HIGHLIGHT_PERIOD_MISSING');
  const verified=h.type==='shot-summary'?h.homeShots===p.shots.home&&h.awayShots===p.shots.away:
   h.type==='score-leader'?h.score.home===p.score.home&&h.score.away===p.score.away&&p.leader!=='tied':
   h.type==='close-score'?p.closeGame&&h.score.home===p.score.home&&h.score.away===p.score.away:
   h.type==='lead-history'?h.count===p.leadChanges:false;
  return {...h,ordinal:index+1,verified};
 });
 const typeCounts={};
 for(const h of highlights)typeCounts[h.type]=(typeCounts[h.type]||0)+1;
 const teams={home:{...base.teams.home},away:{...base.teams.away}};
 const final=base.periods.at(-1);
 const valid=base.audit.consistent&&highlights.every(h=>h.verified)&&highlights.length===base.summary.highlightCount&&Object.values(typeCounts).reduce((a,b)=>a+b,0)===highlights.length&&final.score.home===teams.home.goals&&final.score.away===teams.away.goals;
 if(!valid)throw new Error('EXPERIMENTAL_HIGHLIGHT_AUDIT_FAILED');
 return {kind:'experimental-highlight-audit',researchReady:true,highlights,periods:base.periods.map(p=>({...p,score:{...p.score},shots:{...p.shots}})),teams,summary:{...base.summary,typeCounts},audit:{consistent:true,highlightsChecked:highlights.length},highlightMode:'synthetic-verified-period-facts',game:base.game,official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightAudit};
