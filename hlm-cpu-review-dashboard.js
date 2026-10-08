'use strict';
const {createCPUReviewBriefing}=require('./hlm-cpu-review-briefing');
function buildCPUReviewDashboard(state,teamId,options={}){
 const before=JSON.stringify(state);
 const briefing=createCPUReviewBriefing(state,teamId,options);
 // 346: dashboard counters; 347: urgency lanes; 348: action breakdown;
 // 349: next-decision card; 350: immutable read-only dashboard snapshot.
 const counters=Object.freeze({...briefing.summary,urgent:briefing.urgent.length,standard:briefing.standard.length});
 const lanes=Object.freeze([
  Object.freeze({id:'urgent',title:'Resolve blockers',count:briefing.urgent.length,items:briefing.urgent}),
  Object.freeze({id:'standard',title:'Human review pending',count:briefing.standard.length,items:briefing.standard})
 ]);
 const next=briefing.urgent[0]??briefing.standard[0]??null;
 const nextDecision=next?Object.freeze({id:next.id,status:next.status,nextStep:next.nextStep,requiresHumanReview:true}):null;
 const dashboard=Object.freeze({kind:'cpu-review-dashboard',version:1,teamId:briefing.teamId,
  counters,lanes,actionBreakdown:briefing.nextSteps,nextDecision,
  advisoryOnly:true,executionEnabled:false,persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review dashboard mutated GameState');
 return dashboard;
}
module.exports={buildCPUReviewDashboard};
