'use strict';
/* Disposable IndexedDB-only journaled activation experiment. NOT production cutover code. */
const DB='hlm_phase11_recovery_isolated_v1',STORE='records',LIVE='live',STAGED='staged',JOURNAL='journal';
function clone(v){return JSON.parse(JSON.stringify(v))}
function open(indexedDB){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('database blocked'))})}
async function tx(indexedDB,mode,operation){const db=await open(indexedDB);try{return await new Promise((resolve,reject)=>{const t=db.transaction(STORE,mode),s=t.objectStore(STORE);let result;operation(s,(v)=>{result=v});t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error||Error('transaction failed'));t.onabort=()=>reject(t.error||Error('transaction aborted'))})}finally{db.close()}}
const read=(idb,key)=>tx(idb,'readonly',(s,set)=>{const r=s.get(key);r.onsuccess=()=>set(r.result)});
const put=(idb,key,value)=>tx(idb,'readwrite',s=>s.put(clone(value),key));
async function initialize(idb,original){if(await read(idb,LIVE)!==undefined)throw Error('Already initialized');await put(idb,LIVE,original)}
async function begin(idb,candidate,authorization){if(authorization!==true)throw Error('Explicit GM authorization required');if(await read(idb,JOURNAL)!==undefined)throw Error('Pending journal requires recovery');const original=await read(idb,LIVE);if(!original||!original.settings||original.settings.controlledTeamId===undefined)throw Error('Original franchise invalid');if(!candidate||!candidate.settings||candidate.settings.controlledTeamId!==original.settings.controlledTeamId)throw Error('Controlled team mismatch');await tx(idb,'readwrite',s=>{s.put({phase:'pending',original:clone(original)},JOURNAL);s.put(clone(candidate),STAGED)});return 'staged'}
async function commit(idb){const journal=await read(idb,JOURNAL),candidate=await read(idb,STAGED);if(!journal||journal.phase!=='pending'||!candidate)throw Error('No staged activation');if(candidate.settings.controlledTeamId!==journal.original.settings.controlledTeamId)throw Error('Controlled team mismatch');await tx(idb,'readwrite',s=>{s.put(clone(candidate),LIVE);s.put({...journal,phase:'written'},JOURNAL)});return 'written'}
async function finalize(idb,authorization){
 if(authorization!==true)throw Error('Explicit GM finalization required');
 const journal=await read(idb,JOURNAL),candidate=await read(idb,STAGED),live=await read(idb,LIVE);
 if(!journal||journal.phase!=='written'||!candidate||!live)throw Error('No written activation to finalize');
 if(JSON.stringify(candidate)!==JSON.stringify(live))throw Error('Live state verification failed');
 await tx(idb,'readwrite',s=>{s.put({...journal,phase:'finalized'},JOURNAL);s.delete(STAGED)});
 return 'finalized';
}
async function rollback(idb,authorization){
 if(authorization!==true)throw Error('Explicit GM rollback authorization required');
 const journal=await read(idb,JOURNAL);
 if(!journal||!journal.original)throw Error('No rollback journal available');
 await tx(idb,'readwrite',s=>{s.put(clone(journal.original),LIVE);s.delete(STAGED);s.delete(JOURNAL)});
 if(JSON.stringify(await read(idb,LIVE))!==JSON.stringify(journal.original))throw Error('Rollback verification failed');
 return 'rolled-back';
}
async function recover(idb){const journal=await read(idb,JOURNAL);if(!journal||journal.phase==='finalized')return 'clean';if(!journal.original||!journal.original.settings)throw Error('Corrupt journal: manual recovery required');await tx(idb,'readwrite',s=>{s.put(clone(journal.original),LIVE);s.delete(STAGED);s.delete(JOURNAL)});return 'rolled-back'}
module.exports={DB,initialize,begin,commit,finalize,rollback,recover,read,LIVE,STAGED,JOURNAL};
