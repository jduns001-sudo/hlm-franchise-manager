'use strict';
const {createPhase10FromFrontOffice}=require('./hlm-phase10-front-office-import');
const {auditIntegratedSeason}=require('./hlm-phase11-integrated-season-readiness');
const {assessRosterSeasonSimulationIntegration}=require('./hlm-phase10-roster-season-integration-assessment');
/**
 * Isolated read-only acceptance path from real-world Front Office data to a
 * roster-weighted exhibition. Never writes, activates or advances a save.
 */
function previewImportedFranchiseGame(legacy,{controlledTeamId,currentDate,saveId='phase11-real-universe-preview',games,gameId,seed=1}={}){
 if(!Array.isArray(games)||!games.length)throw Error('Scheduled games required for preview');
 const {nextState,summary}=createPhase10FromFrontOffice(legacy,{controlledTeamId,currentDate,saveId});
 nextState.activity.games=JSON.parse(JSON.stringify(games));if(Array.isArray(legacy.injuries))nextState.activity.injuries=JSON.parse(JSON.stringify(legacy.injuries));
 const readiness=auditIntegratedSeason(nextState);
 if(!readiness.ready)return {ready:false,summary,readiness,game:null,sourceStateMutated:false,persistencePerformed:false};
 const assessment=assessRosterSeasonSimulationIntegration(nextState,gameId,seed);
 return {ready:assessment.exhibition.playable,summary,readiness,game:assessment,sourceStateMutated:false,persistencePerformed:false};
}
module.exports={previewImportedFranchiseGame};
