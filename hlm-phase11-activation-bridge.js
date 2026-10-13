'use strict';
const {IMPORT_KEY}=require('./hlm-phase11-franchise-selection');
const BACKUP_KEY='hlm-phase11-activation-backup-v1';
const ACTIVE_KEY='hlm-phase11-active-source-v1';
function readImported(storage){
 const raw=storage.getItem(IMPORT_KEY);if(raw===null)throw Error('Imported franchise missing');
 let state;try{state=JSON.parse(raw)}catch(e){throw Error('Imported franchise JSON invalid')}
 if(!state||!state.universe||!Array.isArray(state.universe.teams)||!Array.isArray(state.universe.players))throw Error('Imported franchise structure invalid');
 return raw;
}
function preflight(storage){const raw=readImported(storage);return {ready:true,bytes:raw.length,backupExists:storage.getItem(BACKUP_KEY)!==null,active:storage.getItem(ACTIVE_KEY)==='imported'};}
function activate(storage,{authorize=false}={}){
 if(authorize!==true)throw Error('Explicit GM authorization required');
 const imported=readImported(storage);
 if(storage.getItem(BACKUP_KEY)!==null)throw Error('Backup already exists; rollback before reactivating');
 const previous=storage.getItem(ACTIVE_KEY);
 const backup=JSON.stringify({format:'hlm-phase11-activation-backup-v1',previous});
 storage.setItem(BACKUP_KEY,backup);
 try{storage.setItem(ACTIVE_KEY,'imported')}catch(error){try{if(previous===null){storage.setItem(ACTIVE_KEY,'existing')}else storage.setItem(ACTIVE_KEY,previous)}catch(_){}throw error}
 return {active:'imported',importBytes:imported.length};
}
function rollback(storage,{authorize=false}={}){
 if(authorize!==true)throw Error('Explicit rollback authorization required');
 const raw=storage.getItem(BACKUP_KEY);if(raw===null)throw Error('No activation backup');
 let backup;try{backup=JSON.parse(raw)}catch(e){throw Error('Activation backup invalid')}
 if(!backup||backup.format!=='hlm-phase11-activation-backup-v1')throw Error('Activation backup format invalid');
 storage.setItem(ACTIVE_KEY,backup.previous===null?'existing':backup.previous);
 return {active:storage.getItem(ACTIVE_KEY)};
}
module.exports={BACKUP_KEY,ACTIVE_KEY,preflight,activate,rollback};
