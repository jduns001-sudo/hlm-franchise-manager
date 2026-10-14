(function(global){'use strict';
/* Disabled-by-default cutover transaction primitive. Not connected to app.html. */
const DB='hlm_front_office_v8',STORE='state',KEY='db',JOURNAL='phase11-atomic-cutover-journal-v1',FORMAT='hlm-phase11-verified-production-backup-v1';
const enc=new TextEncoder();
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function stringify(x){const s=JSON.stringify(x);if(!s||s.length>5000000||JSON.stringify(JSON.parse(s))!==s)throw Error('Unsupported save');return s}
function open(idb){return new Promise((resolve,reject)=>{const r=idb.open(DB);r.onupgradeneeded=()=>r.transaction.abort();r.onerror=()=>reject(r.error||Error('Missing production DB'));r.onsuccess=()=>resolve(r.result)})}
function read(db,key){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function atomic(db,changes){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);for(const [key,value] of changes){if(value===undefined)s.delete(key);else s.put(value,key)}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Write failed'));tx.onabort=()=>reject(tx.error||Error('Aborted'))})}
function guardedAtomic(db,expectedCurrent,expectedJournal,changes){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  let checked=0,actualCurrent,actualJournal;
  const a=store.get(KEY),b=store.get(JOURNAL);
  a.onsuccess=()=>{actualCurrent=a.result;check()};
  b.onsuccess=()=>{actualJournal=b.result;check()};
  function check(){if(++checked!==2)return;
   try{
    if(stringify(actualCurrent)!==expectedCurrent||((actualJournal===undefined)!==(expectedJournal===undefined))||(actualJournal!==undefined&&stringify(actualJournal)!==stringify(expectedJournal)))throw Error('Concurrent save or journal change detected');
    for(const [key,value] of changes){if(value===undefined)store.delete(key);else store.put(value,key)}
   }catch(e){tx.abort();reject(e)}
  }
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Transaction failed'));tx.onabort=()=>reject(tx.error||Error('Transaction aborted'));
 });
}
function verifyCandidate(current,next){
 if(!current||current.schema!==7||!current.settings||!Array.isArray(current.customPlayers)||!next||next.schema!==7||!Array.isArray(next.customPlayers))throw Error('Unsupported schema 7 save');
 const keys=new Set([...Object.keys(current),...Object.keys(next)]);
 for(const key of keys){if(key==='customPlayers')continue;if(stringify(current[key]??null)!==stringify(next[key]??null))throw Error('Protected field changed: '+key)}
 if(next.customPlayers.length<=current.customPlayers.length)throw Error('No additive roster change');
 const seen=new Set(current.customPlayers.map(p=>String(p.id)));
 for(const p of next.customPlayers.slice(current.customPlayers.length)){if(!p||!Number.isSafeInteger(p.id)||seen.has(String(p.id))||p.teamId===undefined)throw Error('Invalid added player');seen.add(String(p.id))}
 if(stringify(next.customPlayers.slice(0,current.customPlayers.length))!==stringify(current.customPlayers))throw Error('Existing custom players modified');
}
async function verifyBackup(text,current){
 let b;try{b=JSON.parse(text)}catch{throw Error('Backup JSON invalid')}
 if(!b||b.format!==FORMAT||b.source?.database!==DB||b.source?.store!==STORE||b.source?.key!==KEY||b.present!==true||typeof b.payload!=='string')throw Error('Backup provenance invalid');
 if(await digest(b.payload)!==b.sha256||b.payload!==stringify(current))throw Error('Backup mismatch or save changed');
 return b.sha256;
}
function createController(idb,options={}){const enabled=options.allowCutover===true;
 async function commit({candidate,backupText,authorization}){
  if(!enabled)throw Error('Production cutover disabled by default');
  if(authorization!=='I AUTHORIZE PRODUCTION ROSTER IMPORT')throw Error('GM approval required');
  const db=await open(idb);try{
   if(!db.objectStoreNames.contains(STORE))throw Error('Production state store missing');
   const current=await read(db,KEY);if((await read(db,JOURNAL))!==undefined)throw Error('Unresolved cutover journal');
   verifyCandidate(current,candidate);const backupSha256=await verifyBackup(backupText,current);
   const journal={phase:'committed',backupSha256,original:stringify(current),candidateSha256:await digest(stringify(candidate)),createdAt:new Date().toISOString()};
   // The journal and active state update share ONE IndexedDB readwrite transaction.
   await guardedAtomic(db,stringify(current),undefined,[[JOURNAL,journal],[KEY,candidate]]);
   if(stringify(await read(db,KEY))!==stringify(candidate)||(await read(db,JOURNAL))===undefined)throw Error('Postcommit verification failed: journal retained for recovery');
   return {committed:true,backupSha256,rollbackAvailable:true};
  }finally{db.close()}
 }
 async function rollback(authorization){
  if(!enabled)throw Error('Production rollback disabled by default');
  if(authorization!=='I AUTHORIZE PRODUCTION ROLLBACK')throw Error('GM rollback approval required');
  const db=await open(idb);try{
   const journal=await read(db,JOURNAL);if(!journal||journal.phase!=='committed')throw Error('No recoverable journal');
   const active=await read(db,KEY);if(await digest(stringify(active))!==journal.candidateSha256)throw Error('Active save diverged: automatic rollback unsafe');
   if(typeof journal.original!=='string'||typeof journal.backupSha256!=='string')throw Error('Journal backup mismatch');
   if(await digest(journal.original)!==journal.backupSha256)throw Error('Journal backup mismatch');
   let original;try{original=JSON.parse(journal.original)}catch{throw Error('Journal original save invalid')}
   if(!original||original.schema!==7||!original.settings||!Array.isArray(original.customPlayers)||stringify(original)!==journal.original)throw Error('Journal original save invalid');
   await guardedAtomic(db,stringify(active),journal,[[KEY,original],[JOURNAL,undefined]]);
   if(stringify(await read(db,KEY))!==journal.original||(await read(db,JOURNAL))!==undefined)throw Error('Rollback verification failed');
   return {rolledBack:true,exactOriginalRestored:true};
  }finally{db.close()}
 }
 async function status(){const db=await open(idb);try{const journal=await read(db,JOURNAL),present=journal!==undefined;const phase=present&&journal&&typeof journal==='object'&&typeof journal.phase==='string'?journal.phase:null;const shapeValid=phase==='committed'&&typeof journal.original==='string'&&typeof journal.backupSha256==='string'&&typeof journal.candidateSha256==='string';return {cutoverEnabled:enabled,journal:journal??null,journalPresent:present,recoveryRequired:present,journalPhase:phase,journalMalformed:present&&!shapeValid}}finally{db.close()}}
 return {commit,rollback,status,enabled};
}
global.HLMPhase11AtomicCutover={createController,verifyCandidate,verifyBackup};
})(window);