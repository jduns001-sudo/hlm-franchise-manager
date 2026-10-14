(function(global){'use strict';
/* This is an integration API, not a production activation UI. Explicit opt-in required. */
function create({enabled=false,integration,finalGate,workbench,atomic,fetcher,storage,idb}={}){
 const active=enabled===true;
 const controller=atomic?.createController(idb,{allowCutover:active});
 async function activate({reopenedBackupText,gmApproval}={}){
  if(!active)throw Error('Production activation disabled by default');
  if(gmApproval!=='I AUTHORIZE PRODUCTION ROSTER IMPORT')throw Error('Explicit GM approval required');
  if(typeof reopenedBackupText!=='string')throw Error('Reopened downloaded backup required');
  const proof=await finalGate.validate({integration,workbench,fetcher,storage,backupText:reopenedBackupText,atomic});
  if(!proof.readyForControlledTest||proof.productionActivationEnabled)throw Error('Preflight rejected');
  const verified=await integration.verifyReopenedBackup(reopenedBackupText,workbench);
  const plan=await integration.preflight(workbench,fetcher,storage);
  if(plan.addedPlayers!==proof.addedPlayers||plan.controlledTeamId!==proof.controlledTeamId||JSON.stringify(plan.candidate.customPlayers.slice(-plan.addedPlayers))!==JSON.stringify((await integration.preflight(workbench,fetcher,storage)).candidate.customPlayers.slice(-plan.addedPlayers)))throw Error('Preflight changed');
  const current=await workbench.current();
  atomic.verifyCandidate(current,plan.candidate);
  await atomic.verifyBackup(verified.cutoverBackupText,current);
  const finalPlan=await integration.preflight(workbench,fetcher,storage);
  if(JSON.stringify(finalPlan.candidate)!==JSON.stringify(plan.candidate))throw Error('Final roster candidate changed before commit');
  const committed=await controller.commit({candidate:plan.candidate,backupText:verified.cutoverBackupText,authorization:gmApproval});
  return {...committed,addedPlayers:plan.addedPlayers,controlledTeamId:proof.controlledTeamId,requiresReload:true};
 }
 async function rollback({gmApproval}={}){
  if(!active)throw Error('Production rollback disabled by default');
  if(gmApproval!=='I AUTHORIZE PRODUCTION ROLLBACK')throw Error('Explicit GM rollback approval required');
  return controller.rollback(gmApproval);
 }
 return {enabled:active,activate,rollback};
}
global.HLMPhase11ExplicitActivation={create,enabledByDefault:false};
})(window);