/* Standalone isolated IndexedDB CAS. Not integrated with any gameplay UI or real legacy saves. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-game-state').validateGameStateEnvelope:root.HLMPhase10?.validateGameStateEnvelope);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedAtomicSave=api;})(typeof globalThis!=='undefined'?globalThis:this,function(defaultValidate){
'use strict';
const DATABASE='hlm-phase11-isolated-franchise-atomic-v1',RECORDS='records',COMMANDS='commands',ACTIVE='active',BACKUP='legacy-original';
const MODES=['active','migration-pending','rollback-pending','retired-to-legacy'];
function failure(code,message,cause){const e=new Error(message);e.name='IsolatedSaveError';e.code=code;if(cause)e.cause=cause;return e;}
function storageFailure(e){return typeof e?.code==='string'?e:failure(e?.name==='QuotaExceededError'?'QUOTA_EXCEEDED':e?.name==='AbortError'?'TRANSACTION_ABORTED':'STORAGE_FAILED',e?.message||'IndexedDB operation failed',e);}
function identifier(v){return typeof v==='string'&&v.length<=128&&/^[A-Za-z0-9_.:-]+$/.test(v);}
function token(value){if(!value||!identifier(value.epoch)||!Number.isSafeInteger(value.revision)||value.revision<1)throw failure('INVALID_TOKEN','Valid epoch and revision required');return {epoch:value.epoch,revision:value.revision};}
function expectedToken(value){return value===null?null:token(value);}
function create({indexedDB,databaseName=DATABASE,validate=defaultValidate,timeoutMs=5000,makeEpoch=()=>globalThis.crypto.randomUUID()}={}){
 if(typeof databaseName!=='string'||!(databaseName===DATABASE||new RegExp('^'+DATABASE+'-test-[a-z0-9-]+$').test(databaseName)))throw failure('INVALID_DATABASE','Only the isolated database namespace is permitted');
 if(!indexedDB||typeof indexedDB.open!=='function')throw failure('IDB_UNAVAILABLE','IndexedDB required; no alternate storage backend');
 if(typeof validate!=='function'||typeof makeEpoch!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw failure('INVALID_OPTIONS','Validator, epoch factory and bounded timeout required');
 function payload(text){if(typeof text!=='string'||!text.length||text.length>20000000)throw failure('INVALID_PAYLOAD','Bounded GameState JSON required');let state;try{state=JSON.parse(text)}catch{throw failure('INVALID_PAYLOAD','Invalid GameState JSON')}if(validate(state)?.valid!==true)throw failure('INVALID_PAYLOAD','Invalid GameState envelope');return text;}
 function record(value){if(value===undefined)return null;if(!value||value.formatVersion!==1||!MODES.includes(value.authorityMode)||!identifier(value.lastCommandId))throw failure('CORRUPT_RECORD','Unsupported isolated persistence record');token(value);payload(value.payloadText);return value;}
 function backup(value){if(value===undefined)return null;if(!value||value.formatVersion!==1||!/^[a-f0-9]{64}$/.test(value.fingerprint))throw failure('CORRUPT_RECORD','Invalid legacy backup');payload(value.payloadText);return value;}
 async function digest(text){if(!globalThis.crypto?.subtle)throw failure('CRYPTO_UNAVAILABLE','SHA-256 required for migration');return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
 function open(){return new Promise((resolve,reject)=>{
  let request,settled=false;const done=(error,db)=>{if(settled){if(db)db.close();return}settled=true;clearTimeout(timer);error?reject(error):resolve(db)};
  const timer=setTimeout(()=>done(failure('OPEN_TIMEOUT','IndexedDB open timed out')),timeoutMs);
  try{request=indexedDB.open(databaseName,1)}catch(e){done(storageFailure(e));return}
  request.onblocked=()=>done(failure('OPEN_BLOCKED','IndexedDB upgrade is blocked'));
  request.onerror=()=>done(storageFailure(request.error));
  request.onupgradeneeded=event=>{if(settled){request.transaction.abort();return}try{if(event.oldVersion>0)throw failure('CORRUPT_RECORD','Unexpected database upgrade');const db=request.result;db.createObjectStore(RECORDS);db.createObjectStore(COMMANDS)}catch(e){request.transaction.abort();done(storageFailure(e))}};
  request.onsuccess=()=>{const db=request.result;if(db.name!==databaseName||!db.objectStoreNames.contains(RECORDS)||!db.objectStoreNames.contains(COMMANDS)){db.close();done(failure('CORRUPT_RECORD','Unexpected isolated database layout'));return}db.onversionchange=()=>db.close();done(null,db)};
 });}
 async function transaction(mode,work){const db=await open();try{return await new Promise((resolve,reject)=>{
  let tx,result,pendingError,settled=false,timer;
  const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(result)};
  const abort=e=>{pendingError=storageFailure(e);try{tx.abort()}catch{finish(failure('OUTCOME_UNKNOWN','Transaction completion uncertain; reload before any retry',e))}};
  try{tx=db.transaction([RECORDS,COMMANDS],mode);tx.oncomplete=()=>finish(pendingError);tx.onabort=()=>finish(pendingError||failure('TRANSACTION_ABORTED','Isolated transaction aborted',tx.error));tx.onerror=event=>{const error=tx.error||event.target?.error;if(error)pendingError=pendingError||storageFailure(error)};
   timer=setTimeout(()=>abort(failure('TRANSACTION_TIMEOUT','Isolated transaction timed out')),timeoutMs);
   work(tx,{records:tx.objectStore(RECORDS),commands:tx.objectStore(COMMANDS)},value=>{result=value},abort);
  }catch(e){if(tx)abort(e);else finish(storageFailure(e))}
 })}finally{db.close()}}
 async function read(){return transaction('readonly',(tx,s,set,abort)=>{const req=s.records.get(ACTIVE);req.onerror=()=>abort(req.error);req.onsuccess=()=>{try{const r=record(req.result);set(r?Object.freeze({...r}):null)}catch(e){abort(e)}}});}
 async function readLegacyBackup(){const b=await transaction('readonly',(tx,s,set,abort)=>{const req=s.records.get(BACKUP);req.onerror=()=>abort(req.error);req.onsuccess=()=>{try{const b=backup(req.result);set(b?{...b}:null)}catch(e){abort(e)}}});if(b&&await digest(b.payloadText)!==b.fingerprint)throw failure('CORRUPT_RECORD','Legacy backup checksum mismatch');return b?Object.freeze(b):null;}
 async function readCommandReceipt(commandId){
  if(!identifier(commandId))throw failure('INVALID_COMMAND','Valid command ID required');
  return transaction('readonly',(tx,s,set,abort)=>{const req=s.commands.get(commandId);req.onerror=()=>abort(req.error);req.onsuccess=()=>{try{const receipt=req.result;if(receipt===undefined){set(null);return}token(receipt);if(!MODES.includes(receipt.authorityMode))throw failure('CORRUPT_RECORD','Invalid command receipt');set(Object.freeze({commandId,epoch:receipt.epoch,revision:receipt.revision,authorityMode:receipt.authorityMode}))}catch(e){abort(e)}}});
 }
 function mutate(input,transform){
  if(input?.approved!==true)throw failure('APPROVAL_REQUIRED','Explicit human approval required');
  if(!identifier(input.commandId))throw failure('INVALID_COMMAND','Unique command ID required');
  const expected=expectedToken(input.expected);
  return transaction('readwrite',(tx,s,set,abort)=>{
   const reads=[s.records.get(ACTIVE),s.commands.get(input.commandId),s.records.get(BACKUP)];let remaining=reads.length;
   for(const req of reads){req.onerror=()=>abort(req.error);req.onsuccess=()=>{if(--remaining)return;try{
    const current=record(reads[0].result),original=backup(reads[2].result);
    if(reads[1].result!==undefined)throw failure('REPLAYED_COMMAND','Command ID already committed');
    if(expected===null){if(current)throw failure('STALE_REVISION','Isolated save already exists')}
    else{if(!current)throw failure('STALE_REVISION','Expected save is absent');if(current.epoch!==expected.epoch)throw failure('STALE_EPOCH','Storage epoch changed');if(current.revision!==expected.revision)throw failure('STALE_REVISION','Save revision changed')}
    if(current&&current.revision===Number.MAX_SAFE_INTEGER)throw failure('REVISION_EXHAUSTED','Revision cannot be incremented safely');
    const change=transform(current,original);const next={formatVersion:1,epoch:current?.epoch??change.epoch,revision:current?current.revision+1:1,payloadText:change.payloadText,lastCommandId:input.commandId,authorityMode:change.authorityMode};record(next);
    s.records.put(next,ACTIVE);if(change.backup){if(original)throw failure('MIGRATION_CONFLICT','Legacy backup already exists');s.records.put(change.backup,BACKUP)}
    s.commands.put({epoch:next.epoch,revision:next.revision,authorityMode:next.authorityMode},input.commandId);
    set(Object.freeze({...next}));
   }catch(e){abort(e)}}}
  });
 }
 async function commit(input){const text=payload(input?.payloadText);const epoch=input?.expected===null?makeEpoch():null;if(epoch!==null&&!identifier(epoch))throw failure('INVALID_TOKEN','Invalid new epoch');return mutate(input,current=>{if(current&&current.authorityMode!=='active')throw failure('AUTHORITY_INACTIVE','Gameplay writes require active IndexedDB authority');return {epoch,payloadText:text,authorityMode:'active'}});}
 async function beginMigration(input){const text=payload(input?.payloadText),fingerprint=await digest(text),epoch=makeEpoch();if(!identifier(epoch)||input?.expected!==null)throw failure('INVALID_TOKEN','Migration requires an absent record');return mutate(input,(current,original)=>{if(current||original)throw failure('MIGRATION_CONFLICT','Existing save or backup must not be overwritten');return {epoch,payloadText:text,authorityMode:'migration-pending',backup:{formatVersion:1,payloadText:text,fingerprint}}});}
 async function activateMigration(input){if(input?.legacyWritersRetired!==true)throw failure('LEGACY_HANDOFF_REQUIRED','Caller must explicitly retire legacy writers; the adapter cannot retire old tabs');const observed=payload(input.observedLegacyPayloadText),fingerprint=await digest(observed);return mutate(input,(current,original)=>{if(!current||current.authorityMode!=='migration-pending')throw failure('AUTHORITY_INACTIVE','No pending migration');if(!original||original.payloadText!==observed||original.fingerprint!==fingerprint||current.payloadText!==original.payloadText)throw failure('MIGRATION_CONFLICT','Legacy snapshot changed; manual resolution required');return {payloadText:current.payloadText,authorityMode:'active'}});}
 async function beginRollback(input){return mutate(input,current=>{if(!current||current.authorityMode!=='active')throw failure('AUTHORITY_INACTIVE','Active authority required for rollback handoff');return {payloadText:current.payloadText,authorityMode:'rollback-pending'}});}
 async function cancelRollback(input){return mutate(input,current=>{if(!current||current.authorityMode!=='rollback-pending')throw failure('AUTHORITY_INACTIVE','Only a pending rollback freeze can be cancelled');return {payloadText:current.payloadText,authorityMode:'active'}});}
 async function completeRollback(input){const restored=payload(input?.restoredPayloadText);if(input?.legacyHandoffApproved!==true)throw failure('LEGACY_HANDOFF_REQUIRED','Explicit external handoff approval required');return mutate(input,current=>{if(!current||current.authorityMode!=='rollback-pending')throw failure('AUTHORITY_INACTIVE','No pending rollback');if(restored!==current.payloadText)throw failure('MIGRATION_CONFLICT','Restored legacy snapshot differs from frozen latest save');return {payloadText:current.payloadText,authorityMode:'retired-to-legacy'}});}
 // No migration/rollback method reads, writes or deletes a legacy backend. Inputs describe caller-managed fixture/handoff observations.
 return Object.freeze({databaseName,read,commit,beginMigration,activateMigration,beginRollback,cancelRollback,completeRollback,readLegacyBackup,readCommandReceipt});
}
return Object.freeze({DATABASE,create});
});
