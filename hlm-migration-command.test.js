'use strict';
const assert=require('assert');
const { createMigrationCommand, executeMigrationCommand }=require('./hlm-migration-command');
const { LEGACY_STORAGE_KEY }=require('./hlm-browser-persistence-integration');
const { DEFAULT_STORAGE_KEY }=require('./hlm-browser-save-adapter');
function storage(seed={}){const d={...seed};return{getItem:k=>Object.prototype.hasOwnProperty.call(d,k)?d[k]:null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>{delete d[k]}}}
const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
const raw=JSON.stringify(legacy), s=storage({[LEGACY_STORAGE_KEY]:raw}), cmd=createMigrationCommand('primary');
const denied=executeMigrationCommand(cmd,s,{confirmed:false});
assert.strictEqual(denied.executed,false); assert.strictEqual(s.getItem(DEFAULT_STORAGE_KEY),null);
const ok=executeMigrationCommand(cmd,s,{confirmed:true});
assert.strictEqual(ok.executed,true); assert.strictEqual(ok.verified,true);
assert.strictEqual(s.getItem(LEGACY_STORAGE_KEY),raw); assert(s.getItem(DEFAULT_STORAGE_KEY));
assert.throws(()=>executeMigrationCommand(cmd,s,{confirmed:true}), e=>e.code==='TARGET_SAVE_SLOT_EXISTS');
const replaced=executeMigrationCommand(cmd,s,{confirmed:true,replaceExisting:true});
assert.strictEqual(replaced.executed,true); assert.strictEqual(s.getItem(LEGACY_STORAGE_KEY),raw);
console.log('Migration command authorization tests passed.');
