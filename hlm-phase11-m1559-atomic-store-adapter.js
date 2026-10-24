'use strict';
/* Mission 1559: actual isolated atomic compare-and-swap persistence primitive.
 * No trade authorization is granted here. Only call from a separately verified
 * engine-owned authorization path. Production key is categorically forbidden.
 */
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
function createIsolatedAtomicStore({storage,key,parse=JSON.parse,stringify=JSON.stringify}={}){
 const validKey=typeof key==='string'&&/^hlm-[a-zA-Z0-9_-]+$/.test(key)&&key!=='hlm_front_office_v8';
 function read(){
  if(!validKey||!storage||typeof storage.getItem!=='function')return null;
  const raw=storage.getItem(key);
  if(typeof raw!=='string')return null;
  try{return parse(raw)}catch{return null}
 }
 function compareAndSwap({expectedRevision,nextState}={}){
  if(!validKey)return deny('isolated-storage-required');
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')
   return deny('storage-required');
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<1||
     !nextState||nextState.meta?.revision!==expectedRevision+1)
   return deny('invalid-revision-transition');
  const raw=storage.getItem(key);
  if(typeof raw!=='string')return deny('persisted-source-required');
  let persisted;
  try{persisted=parse(raw)}catch{return deny('corrupt-persisted-source')}
  if(persisted?.meta?.revision!==expectedRevision)return deny('stale-persisted-source');
  // Browser localStorage lacks a cross-tab atomic CAS. Fail closed rather than
  // incorrectly claiming a read/check/set sequence is atomic.
  return deny('atomic-storage-transaction-required');
 }
 return Object.freeze({read,compareAndSwap});
}
module.exports={createIsolatedAtomicStore};
