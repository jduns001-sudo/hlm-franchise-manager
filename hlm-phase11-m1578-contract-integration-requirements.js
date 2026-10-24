/* Mission 1578: read-only real-season contract integration requirements.
 * This report never validates external publisher identity or grants an import.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMContractIntegrationRequirements=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(readState,boardFactory,provenanceFactory){
 if(typeof readState!=='function'||typeof boardFactory?.create!=='function'||typeof provenanceFactory?.create!=='function')
  throw Error('Existing saved-season board and provenance readers required');
 const board=boardFactory.create(readState),provenance=provenanceFactory.create(readState);
 let baseline=null;
 function refresh(){
  const state=readState();baseline=state?JSON.stringify(state):null;
  const coverage=board.refresh();
  if(!coverage.ready)return Object.freeze({ready:false,saved:false,importAuthorized:false,blockers:Object.freeze(['isolated franchise missing'])});
  provenance.begin();
  return review();
 }
 function review(){
  if(baseline===null)throw Error('Refresh isolated franchise before requirements inspection');
  const state=readState();
  if(!state||JSON.stringify(state)!==baseline){baseline=null;board.cancel();provenance.cancel();throw Error('Saved franchise changed; refresh required')}
  const coverage=board.review(),blockers=[];
  if(!coverage.teams.length)blockers.push('No saved team coverage');
  for(const team of coverage.teams){
   if(team.blockers.length)blockers.push(team.teamName+': '+team.blockers.join('; '));
  }
  blockers.push('No independently authenticated contract publisher is configured');
  blockers.push('No GM-reviewed atomic contract import transaction exists for this saved season');
  blockers.push('League restrictions, real receiving-team consent and season contract provenance are not authorized');
  if(JSON.stringify(readState())!==baseline){baseline=null;board.cancel();provenance.cancel();throw Error('Saved franchise changed during inspection')}
  return Object.freeze({ready:true,source:'current-saved-isolated-season',teamCount:coverage.teams.length,
   coverage:Object.freeze(coverage.teams),blockers:Object.freeze(blockers),sourceAuthenticated:false,
   saved:false,importAuthorized:false,settlementAuthorized:false,explicitGmApprovalRecorded:false,
   cpuConsentAuthenticated:false,realSeasonIntegrationReady:false,
   message:'Integration requirements only. Never imports contracts, writes GameState, authorizes trades or modifies production saves.'});
 }
 function cancel(){baseline=null;board.cancel();provenance.cancel();return Object.freeze({saved:false,declined:true})}
 return Object.freeze({refresh,review,cancel});
}
return Object.freeze({create});
});
