'use strict';
// Experimental read-only lifecycle gate. Never invokes archive or offseason mutations.
const {projectCommittedSeasonSnapshot}=require('./hlm-phase11-block-m-season-snapshot');
function inspectCommittedLifecycle(row){
 const snapshot=projectCommittedSeasonSnapshot(row);
 const pending=snapshot.games.filter(g=>g.status!=='final').length;
 const finals=snapshot.games.length-pending;
 const regularSeasonReady=snapshot.regularSeasonComplete;
 const blocked=regularSeasonReady?'playoff-evidence-unavailable':'regular-season-incomplete';
 return Object.freeze({
  source:'isolated-sqlite',official:false,productionActivationEnabled:false,
  franchiseRevision:snapshot.franchiseRevision,seasonId:snapshot.seasonId,
  status:regularSeasonReady?'regular-season-finals-recorded':'regular-season-in-progress',
  finals,pending,standings:snapshot.standings,
  completedDayDecisions:snapshot.completedDayDecisions,
  archive:{ready:false,reason:blocked,requiresVerifiedChampionship:true},
  offseason:{ready:false,reason:'championship-not-archived'},
  nextSeason:{ready:false,reason:'championship-not-archived'},
  requiresGMApproval:true,finalDecisionMaker:'human-gm',saved:false
 });
}
module.exports={inspectCommittedLifecycle};
