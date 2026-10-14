(function(global){'use strict';
/* Isolated advisory snapshot comparison; no production app wiring or writes. */
const DB='hlm_front_office_v8',STORE='state',SAVE='db',JOURNAL='phase11-atomic-cutover-journal-v1';
async function capture(idb){
 const db=await new Promise((resolve,reject)=>{const r=idb.open(DB);r.onupgradeneeded=()=>r.transaction.abort();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 try{
  if(!db.objectStoreNames.contains(STORE))throw Error('Save store missing');
  const snapshot=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),store=tx.objectStore(STORE),s=store.get(SAVE),j=store.get(JOURNAL);tx.oncomplete=()=>resolve({save:s.result,journal:j.result});tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Read transaction aborted'))});
  const encoded=JSON.stringify(snapshot);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(encoded)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  return Object.freeze({digest,unresolvedJournal:snapshot.journal!==undefined,savePresent:snapshot.save!==undefined,productionWrites:0,activationEnabled:false});
 }finally{db.close()}
}
async function compare(idb,baseline){
 if(!baseline||typeof baseline.digest!=='string'||!/^[a-f0-9]{64}$/.test(baseline.digest))throw Error('Valid baseline required');
 const latest=await capture(idb);
 return Object.freeze({unchanged:latest.digest===baseline.digest,blocked:latest.digest!==baseline.digest||latest.unresolvedJournal,unresolvedJournal:latest.unresolvedJournal,reason:latest.unresolvedJournal?'Unresolved recovery journal':latest.digest!==baseline.digest?'Concurrent save or journal change':'Unchanged advisory snapshot',productionWrites:0,activationEnabled:false,requiresCommitTimeRevalidation:true});
}
global.HLMPhase11SaveFingerprint=Object.freeze({capture,compare,productionActivationEnabled:false});
})(window);
