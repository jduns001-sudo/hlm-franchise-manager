'use strict';
const {createPhase10FromFrontOffice}=require('./hlm-phase10-front-office-import');
const {auditIntegratedSeason}=require('./hlm-phase11-integrated-season-readiness');
const {simulateControlledRosterDay}=require('./hlm-phase10-controlled-roster-day');
/** Pure, opt-in multiday roster-season preview. No browser save or official results. */
function previewImportedRosterSeason(legacy,{controlledTeamId,currentDate,saveId='phase11-roster-season-preview',games,days=1,seed=1,experimental=false}={}){
 if(experimental!==true)throw Error('Explicit experimental preview opt-in required');
 if(!Number.isSafeInteger(days)||days<1||days>31)throw Error('Preview days must be 1 through 31');
 if(!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid preview seed');
 if(!Array.isArray(games)||!games.length)throw Error('Scheduled games required');
 const {nextState,summary}=createPhase10FromFrontOffice(legacy,{controlledTeamId,currentDate,saveId});
 nextState.activity.games=JSON.parse(JSON.stringify(games));
 if(Array.isArray(legacy.injuries))nextState.activity.injuries=JSON.parse(JSON.stringify(legacy.injuries));
 const audit=auditIntegratedSeason(nextState);
 if(!audit.ready)return {advancedDays:0,blocked:[{day:0,issues:audit.issues}],summary,readiness:audit,nextState:null,official:false,persistencePerformed:false};
 let state=nextState;const daysResults=[];
 for(let i=0;i<days;i++){
  const result=simulateControlledRosterDay(state,seed+i,{experimental:true,persist:false});
  if(!result.advanced)return {advancedDays:i,blocked:[{day:i+1,blockers:result.blocked}],summary,readiness:audit,nextState:null,official:false,persistencePerformed:false};
  state=result.nextState;
  daysResults.push({fromDate:result.fromDate,toDate:result.toDate,results:result.results,standings:result.standings});
 }
 return {advancedDays:days,blocked:[],summary,readiness:audit,days:daysResults,nextState:state,official:false,persistencePerformed:false};
}
module.exports={previewImportedRosterSeason};
