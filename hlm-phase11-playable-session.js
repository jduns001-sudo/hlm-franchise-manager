/* Experimental, isolated-only human GM multi-day gameplay session. No production save access. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMPlayableSession=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function createSession(bridge){
 if(!bridge||typeof bridge.playableFranchiseSnapshot!=='function'||typeof bridge.advancePlayableFranchiseDay!=='function'||typeof bridge.load!=='function')throw Error('Isolated gameplay bridge required');
 let cancelled=false,history=[];
 function inspect(){const snapshot=bridge.playableFranchiseSnapshot();return Object.freeze({kind:'isolated-multiday-gm-session',snapshot,completedApprovedDays:history.length,history:Object.freeze(history.slice()),cancelled,requiresPerDayApproval:true,independentVerification:'pending',productionActivationAllowed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});}
 function approveOneDay(approved,seed){
  if(cancelled)throw Error('Session cancelled; start a new session to continue');
  if(approved!==true)throw Error('Human GM approval required for each day');
  if(!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid deterministic seed');
  const before=bridge.playableFranchiseSnapshot();
  if(!before.simulationAvailable)throw Error('No scheduled games remain');
  const result=bridge.advancePlayableFranchiseDay(true,seed);
  if(result.fromDate!==before.asOfDate||result.toDate===before.asOfDate)throw Error('Invalid isolated day continuity');
  if(result.after.completedControlledGames<before.completedControlledGames||result.after.scheduledGames>before.scheduledGames)throw Error('Invalid isolated game continuity');
  history.push(Object.freeze({fromDate:result.fromDate,toDate:result.toDate,simulatedGames:result.simulatedGames,controlledGamesCompleted:result.after.completedControlledGames,controlledGamesRemaining:result.after.scheduledGames}));
  return inspect();
 }
 function cancel(){cancelled=true;return inspect();}
 function reset(){history=[];cancelled=false;return inspect();}
 return Object.freeze({inspect,approveOneDay,cancel,reset});
}
return Object.freeze({createSession});
});
