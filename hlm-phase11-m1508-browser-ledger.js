/* Mission 1508: isolated IndexedDB authorization-ledger storage.
 * Independent, experimental database. Never writes production saves or
 * settles trades. IndexedDB transactions provide atomic compare-and-swap
 * across tabs within the same origin/database. No external CPU trust.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.HLMPhase11M1508Ledger=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const NAME='hlm-phase11-experiment-m1508-auth-ledger-v1',STORE='ledger';
 const INITIAL={schema:'hlm-m1507y-replay-ledger-v1',revision:0,consumed:{}};
 function clone(x){return JSON.parse(JSON.stringify(x))}
 function open(dbName=NAME){
  return new Promise((resolve,reject)=>{
   if(typeof indexedDB==='undefined')return reject(Error('indexeddb-unavailable'));
   const request=indexedDB.open(dbName,1);
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error('open-failed'));
   request.onblocked=()=>reject(Error('open-blocked'));
  });
 }
 async function read(dbName=NAME){
  const db=await open(dbName);
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get('main');
   let value;
   req.onsuccess=()=>{value=req.result};
   tx.oncomplete=()=>resolve(clone(value||INITIAL));
   tx.onerror=()=>reject(tx.error||Error('read-failed'));
   tx.onabort=()=>reject(tx.error||Error('read-aborted'));
  })}finally{db.close()}
 }
 async function compareAndSwap({expectedRevision,nextLedger,fingerprint},dbName=NAME){
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||
    !nextLedger||nextLedger.schema!==INITIAL.schema||
    nextLedger.revision!==expectedRevision+1||
    !nextLedger.consumed||typeof nextLedger.consumed!=='object'||
    typeof fingerprint!=='string'||! /^[a-f0-9]{64}$/.test(fingerprint)||
    nextLedger.consumed[fingerprint]!==true)
   return {committed:false,code:'invalid-transition'};
  const db=await open(dbName);
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   let accepted=false,reason='conflict';
   const get=store.get('main');
   get.onsuccess=()=>{
    const current=get.result||INITIAL;
    if(current.schema!==INITIAL.schema||current.revision!==expectedRevision||
       !current.consumed||Object.prototype.hasOwnProperty.call(current.consumed,fingerprint)){
     reason='stale-or-replayed';return;
    }
    // Only one readwrite transaction can hold this object store at a time.
    store.put(clone(nextLedger),'main');accepted=true;
   };
   tx.oncomplete=()=>resolve({committed:accepted,code:accepted?'committed':reason});
   tx.onerror=()=>reject(tx.error||Error('write-failed'));
   tx.onabort=()=>reject(tx.error||Error('write-aborted'));
  })}finally{db.close()}
 }
 return Object.freeze({NAME,open,read,compareAndSwap});
});
