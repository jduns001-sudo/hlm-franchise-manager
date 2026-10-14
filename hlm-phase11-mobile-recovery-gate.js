(function(global){'use strict';
/* Advisory read-only gate. Not loaded by app.html; never authorizes a write. */
const DB='hlm_front_office_v8',STORE='state',KEY='db',JOURNAL='phase11-atomic-cutover-journal-v1';
async function snapshot(idb){
 const db=await new Promise((resolve,reject)=>{const r=idb.open(DB);r.onupgradeneeded=()=>r.transaction.abort();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 try{
  if(!db.objectStoreNames.contains(STORE))throw Error('Save store missing');
  return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),s=tx.objectStore(STORE),a=s.get(KEY),b=s.get(JOURNAL);tx.oncomplete=()=>resolve({save:a.result,journal:b.result});tx.onerror=()=>reject(tx.error)});
 }finally{db.close()}
}
async function inspect(idb,backupText){
 const inspector=global.HLMPhase11MobileReadiness;
 if(!inspector||inspector.activationEnabled!==false)throw Error('Read-only inspector unavailable');
 const initial=await snapshot(idb);
 if(initial.journal)return Object.freeze({ready:false,reason:'Unresolved recovery journal',unresolvedJournal:true,productionWrites:0,activationEnabled:false});
 let result;
 try{result=await inspector.inspect(idb,backupText)}catch(e){return Object.freeze({ready:false,reason:String(e.message||e),unresolvedJournal:false,productionWrites:0,activationEnabled:false})}
 const after=await snapshot(idb);
 if(JSON.stringify(initial)!==JSON.stringify(after))return Object.freeze({ready:false,reason:'Concurrent save or recovery journal change',unresolvedJournal:!!after.journal,productionWrites:0,activationEnabled:false});
 return Object.freeze({ready:result.ready,reason:result.reason,unresolvedJournal:result.unresolvedJournal,productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
}
global.HLMPhase11MobileRecoveryGate=Object.freeze({inspect,productionActivationEnabled:false});
})(window);
