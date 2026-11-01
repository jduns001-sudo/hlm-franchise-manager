/* Explicit isolated handoff. No legacy writes, automatic migration, or claimed old-tab retirement. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-game-state').validateGameStateEnvelope:root.HLMPhase10?.validateGameStateEnvelope);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedSaveHandoff=api;})(typeof globalThis!=='undefined'?globalThis:this,function(validate){
'use strict';
const KEY='hlm-phase11-m1340-isolated-single-game-v1';
const limitation='Unmodified legacy localStorage writers cannot be enumerated, fenced or retired by this page. Activation and legacy restoration are blocked. Use a separately isolated origin for a future approved import; do not resume old writers.';
function error(code,message){return Object.assign(new Error(message),{code});}
async function digest(text){if(!globalThis.crypto?.subtle)throw error('CRYPTO_UNAVAILABLE','SHA-256 required');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),v=>v.toString(16).padStart(2,'0')).join('');}
function create(repository,legacy,{makeCommandId=()=>globalThis.crypto.randomUUID()}={}){
 if(!repository||!['read','readLegacyBackup','beginMigration','beginRollback'].every(k=>typeof repository[k]==='function')||typeof legacy?.getItem!=='function')throw error('INVALID_BACKEND','Existing atomic adapter and read-only legacy source required');
 let pending=null,busy=false;
 function source(){return legacy.getItem(KEY);}
 function valid(text){try{if(typeof text!=='string'||validate(JSON.parse(text))?.valid!==true)throw Error()}catch{throw error('INVALID_SOURCE','Legacy source is not a valid GameState envelope')}}
 async function snapshot(){const before=source(),record=await repository.read(),backup=await repository.readLegacyBackup();if(source()!==before)throw error('SOURCE_CHANGED','Legacy source changed during inspection');if(backup&&await digest(backup.payloadText)!==backup.fingerprint)throw error('CORRUPT_BACKUP','Immutable backup SHA-256 mismatch');if(record?.authorityMode==='migration-pending'&&(!backup||record.payloadText!==backup.payloadText))throw error('CORRUPT_BACKUP','Pending import does not match immutable backup');return {legacyText:before,record,backup};}
 function classify(s){
  if(!s.record)return s.backup?'conflict':s.legacyText===null?'fresh':'legacy-only';
  const mode=s.record.authorityMode;
  if(mode==='migration-pending'||mode==='rollback-pending'||mode==='retired-to-legacy')return mode==='retired-to-legacy'?'retired':mode;
  if(mode!=='active')throw error('CORRUPT_RECORD','Unknown authority mode');
  return s.legacyText===null?'active-IDB':'conflict';
 }
 async function inspect(){try{const s=await snapshot(),state=classify(s);return Object.freeze({state,record:s.record,backup:s.backup,legacyPresent:s.legacyText!==null,sourceConflict:!!s.backup&&s.legacyText!==s.backup.payloadText,limitation,automaticMigration:false})}catch(e){return Object.freeze({state:'unavailable',code:e.code||'STORAGE_FAILED',message:e.message,limitation,automaticMigration:false})}}
 async function review(action){
  if(busy)throw error('BUSY','Handoff is in progress');pending=null;
  const s=await snapshot(),state=classify(s);
  if(action==='migration'){if(state!=='legacy-only')throw error('HANDOFF_CONFLICT','Migration requires only a legacy save and no IndexedDB authority');valid(s.legacyText)}
  else if(action==='rollback'){if(state!=='active-IDB')throw error('HANDOFF_CONFLICT','Rollback freeze requires active IndexedDB authority without a legacy conflict')}
  else if(action==='cancel-rollback'){if(state!=='rollback-pending'||s.legacyText!==null)throw error('HANDOFF_CONFLICT','Cancel only a rollback freeze without any legacy backend');if(typeof repository.cancelRollback!=='function')throw error('INVALID_BACKEND','Transactional rollback cancellation unavailable')}
  else throw error('INVALID_ACTION','Review migration, rollback or cancel-rollback');
  const handle=Object.freeze({action,state,epoch:s.record?.epoch??null,revision:s.record?.revision??null,fingerprint:await digest(action==='migration'?s.legacyText:s.record.payloadText),requiresHumanApproval:true,activationBlocked:true,limitation});
  pending={handle,snapshot:s};return handle;
 }
 function decline(handle){if(pending?.handle!==handle)throw error('STALE_REVIEW','Unknown or consumed review');pending=null;return Object.freeze({saved:false,reason:'declined'});}
 async function approve(handle,approved){
  if(busy)throw error('BUSY','Handoff is in progress');if(pending?.handle!==handle)throw error('STALE_REVIEW','Unknown or consumed review');const reviewed=pending;pending=null;
  if(approved!==true)throw error('APPROVAL_REQUIRED','Explicit human GM approval required');busy=true;
  try{const current=await snapshot();if(JSON.stringify(current)!==JSON.stringify(reviewed.snapshot))throw error('SOURCE_CHANGED','Reviewed source or authority changed; review again');
   const input={expected:current.record?{epoch:current.record.epoch,revision:current.record.revision}:null,commandId:makeCommandId(),approved:true};
   if(handle.action==='cancel-rollback'&&current.legacyText!==null)throw error('HANDOFF_CONFLICT','Legacy backend must remain absent');
   const record=handle.action==='migration'?await repository.beginMigration({...input,payloadText:current.legacyText}):handle.action==='cancel-rollback'?await repository.cancelRollback(input):await repository.beginRollback(input);
   // Read after completion independently verifies durable bytes and immutable backup.
   const persisted=await snapshot();if(persisted.legacyText!==current.legacyText)throw error('SOURCE_CHANGED','Legacy source changed during durable freeze; inspect pending state');if(!persisted.record||JSON.stringify(persisted.record)!==JSON.stringify(record))throw error('OUTCOME_UNKNOWN','Handoff changed after completion; inspect before retry');
   return Object.freeze({saved:true,state:classify(persisted),requiresReload:handle.action==='cancel-rollback',fingerprint:await digest(record.payloadText),activationBlocked:true,limitation});
  }finally{busy=false}
 }
 async function resume(){pending=null;return inspect();} // Observation only, never an implicit activation or downgrade.
 async function activateMigration(){pending=null;const s=await snapshot();if(classify(s)!=='migration-pending')throw error('HANDOFF_CONFLICT','No pending migration');if(s.legacyText!==s.backup.payloadText)throw error('SOURCE_CHANGED','Legacy source changed since backup');throw error('RETIREMENT_UNPROVEN',limitation);}
 async function restoreLegacy(){pending=null;const s=await snapshot();if(classify(s)!=='rollback-pending')throw error('HANDOFF_CONFLICT','No frozen rollback');if(s.legacyText!==null&&s.legacyText!==s.record.payloadText)throw error('HANDOFF_CONFLICT','Existing legacy bytes differ from latest frozen progress');throw error('RETIREMENT_UNPROVEN',limitation);}
 return Object.freeze({inspect,review,approve,decline,resume,activateMigration,restoreLegacy});
}
return Object.freeze({KEY,create});
});
