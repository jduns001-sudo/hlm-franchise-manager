/* Mission 1510: isolated experimental atomic ledger + game-state record.
 * No production saves, CPU consent, trade settlement, or UI integration.
 * One IndexedDB readwrite transaction covers BOTH records in one store.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.HLMPhase11M1510AtomicState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const NAME='hlm-phase11-experiment-m1510-atomic-state-v1',STORE='atomic';
 const SCHEMA='hlm-m1507y-replay-ledger-v1';
 const initialLedger=()=>({schema:SCHEMA,revision:0,consumed:{}});
 const initialGame=()=>({schema:'hlm-m1510-isolated-game-v1',revision:0,events:[]});
 const clone=x=>JSON.parse(JSON.stringify(x));
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function open(dbName=NAME){
  return new Promise((resolve,reject)=>{
   if(typeof indexedDB==='undefined')return reject(Error('indexeddb-unavailable'));
   const req=indexedDB.open(dbName,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('open-failed'));
   req.onblocked=()=>reject(Error('open-blocked'));
  });
 }
 async function read(dbName=NAME){
  const db=await open(dbName);
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readonly'),store=tx.objectStore(STORE);
   const ledger=store.get('ledger'),game=store.get('game');let snapshot;
   game.onsuccess=()=>{snapshot={ledger:clone(ledger.result||initialLedger()),game:clone(game.result||initialGame())}};
   tx.oncomplete=()=>resolve(snapshot);
   tx.onerror=()=>reject(tx.error||Error('read-failed'));
   tx.onabort=()=>reject(tx.error||Error('read-aborted'));
  })}finally{db.close()}
 }
 async function commit(input={},dbName=NAME){
  const deny=code=>({committed:false,saved:false,settlementAuthorized:false,code});
  if(input.experimentalEnabled!==true)return deny('experiment-disabled');
  if(input.cancelled===true||input.declined===true)return deny('gm-declined-or-cancelled');
  if(input.gmApproved!==true)return deny('gm-approval-required');
  // Synthetic experimental authorization only. Not a CPU trade decision.
  if(input.syntheticTestAuthorization!==true)return deny('real-authorization-not-supported');
  const {expectedLedgerRevision:l,expectedGameRevision:g,fingerprint:fp,eventId}=input;
  if(!Number.isSafeInteger(l)||l<0||!Number.isSafeInteger(g)||g<0||
   typeof fp!=='string'||! /^[a-f0-9]{64}$/.test(fp)||
   typeof eventId!=='string'||! /^[a-zA-Z0-9_-]{1,80}$/.test(eventId))
   return deny('invalid-input');
  const db=await open(dbName);
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   let ledger,game,seen=0,accepted=false,reason='stale-or-replayed';
   function stage(){
    if(++seen!==2)return;
    const L=ledger||initialLedger(),G=game||initialGame();
    if(L.schema!==SCHEMA||G.schema!=='hlm-m1510-isolated-game-v1'||
       L.revision!==l||G.revision!==g||
       !L.consumed||typeof L.consumed!=='object'||Array.isArray(L.consumed)||
       !Array.isArray(G.events)||own(L.consumed,fp)||G.events.some(e=>e.id===eventId)||
       Object.keys(L.consumed).some(k=>! /^[a-f0-9]{64}$/.test(k)||L.consumed[k]!==true)){
      reason='stale-or-replayed';return;
    }
    if(L.revision===Number.MAX_SAFE_INTEGER||G.revision===Number.MAX_SAFE_INTEGER){
      reason='revision-exhausted';return;
    }
    // Both puts share a single transaction: either both persist or neither.
    store.put({schema:SCHEMA,revision:l+1,consumed:{...L.consumed,[fp]:true}},'ledger');
    store.put({schema:G.schema,revision:g+1,events:[...G.events,{id:eventId,fingerprint:fp}]},'game');
    accepted=true;
   }
   const lr=store.get('ledger'),gr=store.get('game');
   lr.onsuccess=()=>{ledger=lr.result;stage()};
   gr.onsuccess=()=>{game=gr.result;stage()};
   tx.oncomplete=()=>resolve({committed:accepted,saved:false,settlementAuthorized:false,code:accepted?'isolated-test-commit':'stale-or-replayed'});
   tx.onerror=()=>reject(tx.error||Error('write-failed'));
   tx.onabort=()=>reject(tx.error||Error('write-aborted'));
  })}finally{db.close()}
 }
 return Object.freeze({NAME,open,read,commit});
});
