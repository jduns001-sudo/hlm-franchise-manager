'use strict';
/* Mission 1516: atomic experimental GameState + ledger persistence.
 * No real trade settlement. Synthetic test authorization is required.
 * Uses one IndexedDB readwrite transaction for both records.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const STORE='records',DEFAULT_DB='hlm-phase11-m1516-experimental-state-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
function open(name=DEFAULT_DB){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined')return reject(Error('indexeddb-unavailable'));
  const req=indexedDB.open(name,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('open-failed'));
  req.onblocked=()=>reject(Error('open-blocked'));
 });
}
async function read(name=DEFAULT_DB){
 const db=await open(name);
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),store=tx.objectStore(STORE);
  let game=null,ledger=null;
  store.get('game').onsuccess=e=>{game=e.target.result??null};
  store.get('ledger').onsuccess=e=>{ledger=e.target.result??null};
  tx.oncomplete=()=>resolve({game:game===null?null:clone(game),ledger:ledger===null?null:clone(ledger)});
  tx.onerror=()=>reject(tx.error||Error('read-failed'));
  tx.onabort=()=>reject(tx.error||Error('read-aborted'));
 })}finally{db.close()}
}
async function commit(input={},name=DEFAULT_DB){
 const deny=code=>({committed:false,saved:false,settlementAuthorized:false,code});
 if(input.experimentalEnabled!==true)return deny('experiment-disabled');
 if(input.cancelled===true||input.declined===true)return deny('gm-cancelled-or-declined');
 if(input.gmApproved!==true)return deny('gm-approval-required');
 if(input.syntheticTestAuthorization!==true)return deny('real-trade-authorization-unavailable');
 if(input.realTradeSettlement===true)return deny('real-trade-settlement-disabled');
 const {expectedRevision,candidateState,eventId}=input;
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||
  !candidateState||validateGameStateEnvelope(candidateState).valid!==true||
  typeof eventId!=='string'||! /^[a-zA-Z0-9_-]{1,80}$/.test(eventId))
  return deny('invalid-input');
 if(candidateState.meta?.revision!==expectedRevision+1)return deny('candidate-revision-mismatch');
 const expectedLedger=input.expectedLedger===undefined?undefined:clone(input.expectedLedger);
 const db=await open(name);
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  let game=null,ledger=null,seen=0,accepted=false,code='stale-or-replayed';
  const stage=()=>{
   if(++seen!==2)return;
   const oldRev=game?.meta?.revision??0;
   const events=ledger?.events??[];
   if((game===null)!==(ledger===null)||
    (ledger!==null&&ledger.revision!==oldRev)||
    (expectedLedger!==undefined&&JSON.stringify(ledger)!==JSON.stringify(expectedLedger))||
    !Number.isSafeInteger(oldRev)||oldRev!==expectedRevision||
    !Array.isArray(events)||events.some(e=>e.id===eventId)||
    (game!==null&&validateGameStateEnvelope(game).valid!==true)){
    code='stale-or-replayed';return;
   }
   if(expectedRevision===Number.MAX_SAFE_INTEGER){code='revision-exhausted';return}
   store.put(clone(candidateState),'game');
   store.put({revision:expectedRevision+1,events:[...events,{id:eventId,experimental:true}]},'ledger');
   accepted=true;code='isolated-synthetic-commit';
  };
  store.get('game').onsuccess=e=>{game=e.target.result??null;stage()};
  store.get('ledger').onsuccess=e=>{ledger=e.target.result??null;stage()};
  tx.oncomplete=()=>resolve({committed:accepted,saved:accepted,settlementAuthorized:false,code});
  tx.onerror=()=>reject(tx.error||Error('write-failed'));
  tx.onabort=()=>reject(tx.error||Error('write-aborted'));
 })}finally{db.close()}
}
module.exports={open,read,commit,DEFAULT_DB};
