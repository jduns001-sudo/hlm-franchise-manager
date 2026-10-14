(function(global){'use strict';
/* Isolated read-only recovery status, never changes an interrupted journal or franchise save. */
const DB='hlm_front_office_v8',STORE='state',SAVE='db',JOURNAL='phase11-atomic-cutover-journal-v1';
async function inspect(idb){
 const db=await new Promise((resolve,reject)=>{const q=idb.open(DB);q.onupgradeneeded=()=>q.transaction.abort();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
 try{
  if(!db.objectStoreNames.contains(STORE))throw Error('Save store missing');
  const snapshot=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),s=tx.objectStore(STORE),save=s.get(SAVE),journal=s.get(JOURNAL);tx.oncomplete=()=>resolve({save:save.result,journal:journal.result});tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Snapshot aborted'))});
  const unresolved=snapshot.journal!==undefined;
  const validSave=snapshot.save?.schema===7&&Array.isArray(snapshot.save.customPlayers);
  return Object.freeze({blocked:unresolved||!validSave,unresolvedJournal:unresolved,saveValid:validSave,reason:unresolved?'Interrupted transaction requires explicit recovery':!validSave?'Unsupported or missing franchise save':'No interrupted transaction detected',productionWrites:0,activationEnabled:false,requiresExplicitGMApproval:true});
 }finally{db.close()}
}
global.HLMPhase11RecoveryStatus=Object.freeze({inspect,productionActivationEnabled:false});
})(window);
