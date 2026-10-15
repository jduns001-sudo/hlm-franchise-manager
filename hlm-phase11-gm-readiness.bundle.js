/* Experimental browser GM readiness bundle; advisory only. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-season-decision-history')return global.HLMPhase11SeasonDecisionHistory;throw Error('Unsupported module')};
'use strict';
/* Advisory-only readiness from persisted isolated franchise season.
   No GM decisions are executed, no production save is accessed. */
const {projectSeason}=require('./hlm-phase11-season-decision-history');
function buildGMReadiness(state){
 const season=projectSeason(state),teamId=season.controlledTeamId;
 const upcoming=season.schedule.filter(g=>g.homeTeamId===teamId||g.awayTeamId===teamId).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const record=season.standings.find(t=>t.teamId===teamId)||{gp:0,w:0,l:0,t:0,points:0,gf:0,ga:0};
 const lastGames=season.history.filter(g=>g.homeTeamId===teamId||g.awayTeamId===teamId).slice(-5);
 const recommendations=[
  {type:'lineup-review',priority:upcoming.length?'high':'normal',gameId:upcoming[0]?.id??null,requiresGMApproval:true,automaticallyApplied:false},
  {type:'season-performance-review',priority:'normal',gamesPlayed:record.gp,requiresGMApproval:true,automaticallyApplied:false}
 ];
 return {official:false,productionActivationEnabled:false,teamId,currentDate:season.currentDate,record,nextGame:upcoming[0]||null,lastGames,recommendations};
}
module.exports={buildGMReadiness};

global.HLMPhase11GMReadiness=module.exports;
})(typeof window!=='undefined'?window:globalThis);
