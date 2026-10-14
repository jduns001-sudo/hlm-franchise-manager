(function(global){'use strict';
/* Read-only readiness inspection. No activation, writes, or production UI integration. */
const DB='hlm_front_office_v8',STORE='state',KEY='db',JOURNAL='phase11-atomic-cutover-journal-v1';
const FORMAT='hlm-phase11-verified-production-backup-v1';
async function hash(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('')}
function read(db,key){return new Promise((resolve,reject)=>{const t=db.transaction(STORE,'readonly'),r=t.objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function inspect(idb,backupText){
 if(typeof backupText!=='string'||backupText.length>6000000)throw Error('Reopened backup required');
 const b=JSON.parse(backupText);
 if(b?.format!==FORMAT||b?.source?.database!==DB||b?.source?.store!==STORE||b?.source?.key!==KEY||b.present!==true||typeof b.payload!=='string')throw Error('Backup provenance invalid');
 if(await hash(b.payload)!==b.sha256)throw Error('Backup integrity mismatch');
 const db=await new Promise((resolve,reject)=>{const r=idb.open(DB);r.onupgradeneeded=()=>r.transaction.abort();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 try{
  if(!db.objectStoreNames.contains(STORE))throw Error('Missing save store');
  const before=await read(db,KEY),journal=await read(db,JOURNAL);
  const live=JSON.stringify(before);
  if(live!==b.payload)throw Error('Stale backup: active save changed');
  const valid=before?.schema===7&&Array.isArray(before.customPlayers);
  if(!valid)throw Error('Unsupported save schema');
  const after=JSON.stringify(await read(db,KEY));
  if(after!==live)throw Error('Concurrent save change during inspection');
  return {ready:!journal,reason:journal?'Recovery journal must be resolved':'Verified read-only preflight',backupSha256:b.sha256,controlledTeamId:before.settings?.controlledTeamId??null,customPlayers:before.customPlayers.length,unresolvedJournal:!!journal,productionWrites:0,activationEnabled:false,requiresExplicitGMApproval:true};
 }finally{db.close()}
}
global.HLMPhase11MobileReadiness={inspect,activationEnabled:false};
})(window);
