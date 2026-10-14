(function(global){'use strict';
/* Final read-only production readiness check. Does not expose cutover enablement. */
async function validate({integration,workbench,fetcher,storage,backupText,atomic}){
 if(!integration||!workbench||!atomic)throw Error('Import services unavailable');
 const first=await integration.preflight(workbench,fetcher,storage);
 const backup=await integration.verifyReopenedBackup(backupText,workbench);
 const second=await integration.preflight(workbench,fetcher,storage);
 if(JSON.stringify(first.candidate)!==JSON.stringify(second.candidate))throw Error('Universe, mapping or staged roster changed during verification');
 const current=await workbench.current();
 atomic.verifyCandidate(current,second.candidate);
 await atomic.verifyBackup(backup.cutoverBackupText,current);
 const status=await atomic.createController(indexedDB).status();
 if(status.journal)throw Error('Unresolved production recovery journal');
 if(status.cutoverEnabled!==false)throw Error('Production cutover unexpectedly enabled');
 const base=await fetcher('./hlm-universe.json',{cache:'no-store'});
 if(!base.ok)throw Error('Cannot refresh production universe');
 const universe=await base.json(),existing=new Set([...universe.players,...current.customPlayers].map(p=>String(p.id)));
 for(const p of second.candidate.customPlayers.slice(current.customPlayers.length)){
  if(existing.has(String(p.id)))throw Error('Late base/custom player ID collision');
 }
 if(JSON.stringify(await workbench.current())!==JSON.stringify(current))throw Error('Production save changed during final verification');
 return {readyForControlledTest:true,productionActivationEnabled:false,productionWrites:0,addedPlayers:second.addedPlayers,controlledTeamId:current.settings.controlledTeamId,backupSha256:backup.sha256,protectedFieldsPreserved:true};
}
global.HLMPhase11FinalRosterGate={validate,productionActivationEnabled:false};
})(window);