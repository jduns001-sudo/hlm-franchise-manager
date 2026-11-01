'use strict';
const assert=require('node:assert/strict');
const {create,DATABASE}=require('./hlm-phase11-isolated-atomic-save');
const {createGameStateEnvelope}=require('./hlm-game-state');
const started=performance.now();
let assertions=0;function check(v,label){++assertions;assert.ok(v,label)}
async function rejects(fn,code){++assertions;await assert.rejects(fn,e=>e.code===code)}
function throws(fn,code){++assertions;assert.throws(fn,e=>e.code===code)}
const text=JSON.stringify(createGameStateEnvelope({meta:{saveId:'unchanged',controlledTeamId:1},teams:[{id:1}]}));
// Contract-focused fault backend, not an IndexedDB concurrency substitute. Chromium tests exercise real transactions.
function backend({openError,blocked=false,hang=false,transactionError,requestError,abortAfterPut=false}={}){
 const data=new Map(),commands=new Map();let transactionStarted=false,putRequested=false,completed=false,writes=0,openNames=[];
 const factory={open(name){openNames.push(name);const request={};queueMicrotask(()=>{if(hang)return;if(blocked){request.onblocked?.();return}if(openError){request.error=openError;request.onerror?.();return}
 const db={name,objectStoreNames:{contains:n=>['records','commands'].includes(n)},close(){},transaction(names,mode){transactionStarted=true;if(transactionError)throw transactionError;let aborted=false,timer;const workData=new Map(data),workCommands=new Map(commands);const tx={error:null,abort(){if(aborted)return;aborted=true;clearTimeout(timer);queueMicrotask(()=>tx.onabort?.())},objectStore(store){const map=store==='records'?workData:workCommands;return {get(key){const req={};queueMicrotask(()=>{if(aborted)return;if(requestError){req.error=requestError;req.onerror?.();return}req.result=map.get(key);req.onsuccess?.();schedule()});return req},put(value,key){putRequested=true;++writes;map.set(key,value);if(abortAfterPut)queueMicrotask(()=>tx.abort());schedule();return {} }}}};function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(aborted)return;data.clear();for(const [k,v]of workData)data.set(k,v);commands.clear();for(const [k,v]of workCommands)commands.set(k,v);completed=true;tx.oncomplete?.()},10)}return tx}};
 request.result=db;request.onsuccess?.();});return request}};
 return {factory,data,commands,stats:()=>({transactionStarted,putRequested,completed,writes,openNames})};
}
(async()=>{
 throws(()=>create(), 'IDB_UNAVAILABLE');
 for(const name of ['hlm_front_office_v8','hlm-phase11-m1340-isolated-single-game-v1',DATABASE+'-production',DATABASE+'-test-../prod'])throws(()=>create({indexedDB:{open(){}},databaseName:name}),'INVALID_DATABASE');
 throws(()=>create({indexedDB:{open(){}},timeoutMs:0}),'INVALID_OPTIONS');
 const b=backend(),store=create({indexedDB:b.factory,makeEpoch:()=> 'epoch-1'});
 await rejects(()=>store.commit({expected:null,payloadText:text,commandId:'unauthorized',approved:false}),'APPROVAL_REQUIRED');check(b.stats().openNames.length===0,'authorization rejects before storage opens');
 await rejects(()=>store.commit({expected:null,payloadText:'{}',commandId:'bad',approved:true}),'INVALID_PAYLOAD');
 await rejects(()=>store.commit({expected:{epoch:'x',revision:0},payloadText:text,commandId:'bad-token',approved:true}),'INVALID_TOKEN');
 let acknowledged=false;const operation=store.commit({expected:null,payloadText:text,commandId:'create',approved:true}).then(v=>{acknowledged=true;return v});
 await new Promise(ok=>setTimeout(ok,1));check(b.stats().putRequested&&!b.stats().completed&&!acknowledged,'put does not acknowledge before transaction completion');
 const first=await operation;check(b.stats().completed&&acknowledged,'acknowledged after completion');check(first.formatVersion===1&&first.epoch==='epoch-1'&&first.revision===1&&first.payloadText===text&&first.authorityMode==='active','envelope preserved in external metadata');
 await rejects(()=>store.commit({expected:first,payloadText:text,commandId:'create',approved:true}),'REPLAYED_COMMAND');
 await rejects(()=>store.commit({expected:{epoch:'other',revision:1},payloadText:text,commandId:'epoch',approved:true}),'STALE_EPOCH');
 await rejects(()=>store.commit({expected:{epoch:'epoch-1',revision:2},payloadText:text,commandId:'stale',approved:true}),'STALE_REVISION');
 check((await store.read()).revision===1,'rejected operations do not increment revision');
 const aborting=backend({abortAfterPut:true}),abortStore=create({indexedDB:aborting.factory,makeEpoch:()=> 'epoch-abort'});
 await rejects(()=>abortStore.commit({expected:null,payloadText:text,commandId:'abort',approved:true}),'TRANSACTION_ABORTED');check(aborting.data.size===0&&!aborting.stats().completed,'aborted put never reaches persistent fixture');
 const quota=backend({requestError:new DOMException('full','QuotaExceededError')});await rejects(()=>create({indexedDB:quota.factory}).read(),'QUOTA_EXCEEDED');
 const denied=backend({openError:new DOMException('denied','SecurityError')});await rejects(()=>create({indexedDB:denied.factory}).read(),'STORAGE_FAILED');
 await rejects(()=>create({indexedDB:backend({blocked:true}).factory}).read(),'OPEN_BLOCKED');
 await rejects(()=>create({indexedDB:backend({hang:true}).factory,timeoutMs:5}).read(),'OPEN_TIMEOUT');
 const broken=backend({transactionError:new DOMException('transaction unavailable','InvalidStateError')});await rejects(()=>create({indexedDB:broken.factory}).read(),'STORAGE_FAILED');
 const m=backend(),migration=create({indexedDB:m.factory,makeEpoch:()=> 'epoch-migration'});const pending=await migration.beginMigration({expected:null,payloadText:text,commandId:'migrate',approved:true});
 check(pending.authorityMode==='migration-pending'&&pending.revision===1,'migration starts frozen');check((await migration.readLegacyBackup()).payloadText===text,'exact legacy bytes preserved');
 await rejects(()=>migration.commit({expected:pending,payloadText:text,commandId:'premature',approved:true}),'AUTHORITY_INACTIVE');
 await rejects(()=>migration.activateMigration({expected:pending,observedLegacyPayloadText:text,commandId:'activate-denied',approved:true}),'LEGACY_HANDOFF_REQUIRED');
 const changed=JSON.stringify({...JSON.parse(text),finances:{conflict:true}});await rejects(()=>migration.activateMigration({expected:pending,observedLegacyPayloadText:changed,legacyWritersRetired:true,commandId:'conflict',approved:true}),'MIGRATION_CONFLICT');
 check((await migration.read()).authorityMode==='migration-pending','conflicting migration remains frozen');
 const active=await migration.activateMigration({expected:pending,observedLegacyPayloadText:text,legacyWritersRetired:true,commandId:'activate',approved:true});check(active.revision===2&&active.payloadText===text,'handoff activates same envelope at next revision');
 const receiptBefore=await store.read();
 check(await store.readCommandReceipt('absent')===null,'unknown receipt is absent');
 const receipt=await store.readCommandReceipt('create');check(receipt.commandId==='create'&&receipt.epoch===first.epoch&&receipt.revision===1&&Object.isFrozen(receipt),'read-only frozen receipt lookup');
 await store.commit({expected:receiptBefore,payloadText:text,commandId:'second',approved:true});
 check((await store.readCommandReceipt('create')).revision===1&&(await store.read()).revision===2,'historical receipt survives later commits');
 await rejects(()=>store.readCommandReceipt('invalid command'),'INVALID_COMMAND');
 const unchanged=await store.read();await store.readCommandReceipt('second');check(JSON.stringify(await store.read())===JSON.stringify(unchanged),'receipt read causes no revision change');
 const cancelBackend=backend(),cancelStore=create({indexedDB:cancelBackend.factory,makeEpoch:()=> 'cancel-epoch'});
 const cancelInitial=await cancelStore.commit({expected:null,payloadText:' \n'+text+'\n',commandId:'cancel-seed',approved:true});
 await rejects(()=>cancelStore.cancelRollback({expected:cancelInitial,commandId:'active-cancel',approved:true}),'AUTHORITY_INACTIVE');
 const frozen=await cancelStore.beginRollback({expected:cancelInitial,commandId:'cancel-freeze',approved:true});
 await rejects(()=>cancelStore.cancelRollback({expected:frozen,commandId:'cancel-unapproved',approved:false}),'APPROVAL_REQUIRED');
 await rejects(()=>cancelStore.cancelRollback({expected:{epoch:'wrong',revision:frozen.revision},commandId:'cancel-epoch-stale',approved:true}),'STALE_EPOCH');
 await rejects(()=>cancelStore.cancelRollback({expected:cancelInitial,commandId:'cancel-revision-stale',approved:true}),'STALE_REVISION');
 const cancelled=await cancelStore.cancelRollback({expected:frozen,commandId:'cancel-once',approved:true});
 check(cancelled.authorityMode==='active'&&cancelled.epoch===frozen.epoch&&cancelled.revision===frozen.revision+1&&cancelled.payloadText===frozen.payloadText,'cancellation keeps exact bytes and epoch with one revision');
 check((await cancelStore.readCommandReceipt('cancel-once')).revision===cancelled.revision,'durable cancellation receipt');
 check(JSON.stringify(await create({indexedDB:cancelBackend.factory}).read())===JSON.stringify(cancelled),'fresh connection verifies cancellation');
 await rejects(()=>cancelStore.cancelRollback({expected:frozen,commandId:'cancel-once',approved:true}),'REPLAYED_COMMAND');
 await rejects(()=>cancelStore.cancelRollback({expected:frozen,commandId:'cancel-competitor',approved:true}),'STALE_REVISION');
 await rejects(()=>migration.cancelRollback({expected:pending,commandId:'cancel-old-migration',approved:true}),'STALE_REVISION');
 const pendingAgain=await migration.beginRollback({expected:active,commandId:'freeze-for-retirement',approved:true});
 const retired=await migration.completeRollback({expected:pendingAgain,restoredPayloadText:text,legacyHandoffApproved:true,commandId:'retire-fixture',approved:true});
 await rejects(()=>migration.cancelRollback({expected:retired,commandId:'cancel-retired',approved:true}),'AUTHORITY_INACTIVE');
 const pendingBackend=backend(),pendingStore=create({indexedDB:pendingBackend.factory,makeEpoch:()=> 'pending-epoch'});
 const imported=await pendingStore.beginMigration({expected:null,payloadText:text,commandId:'migration-fixture',approved:true});
 await rejects(()=>pendingStore.cancelRollback({expected:imported,commandId:'cancel-migration',approved:true}),'AUTHORITY_INACTIVE');
 const cancelAbortBackend=backend({abortAfterPut:true});cancelAbortBackend.data.set('active',frozen);const cancelAbortStore=create({indexedDB:cancelAbortBackend.factory});
 await rejects(()=>cancelAbortStore.cancelRollback({expected:frozen,commandId:'cancel-abort',approved:true}),'TRANSACTION_ABORTED');
 check(JSON.stringify(await cancelAbortStore.read())===JSON.stringify(frozen)&&await cancelAbortStore.readCommandReceipt('cancel-abort')===null,'abort preserves frozen payload and removes receipt');
 const recoveryBackend=backend();recoveryBackend.data.set('active',await cancelAbortStore.read());const recovered=await create({indexedDB:recoveryBackend.factory}).cancelRollback({expected:frozen,commandId:'cancel-recovered',approved:true});
 check(recovered.payloadText===frozen.payloadText&&recovered.revision===frozen.revision+1,'explicit retry from persisted freeze recovers without replacing data');
 check(b.stats().openNames.every(n=>n===DATABASE),'only isolated database opened');
 console.log(JSON.stringify({status:'passed',assertions,elapsedSeconds:(performance.now()-started)/1000,note:'Node fault-contract tests; real atomicity is exercised in Chromium.'}));
})().catch(e=>{console.error(e);process.exitCode=1});
