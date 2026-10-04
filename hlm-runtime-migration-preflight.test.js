'use strict';
const assert=require('assert');
const { inspectRuntimeMigrationReadiness }=require('./hlm-runtime-migration-preflight');
const { LEGACY_STORAGE_KEY }=require('./hlm-browser-persistence-integration');
const { DEFAULT_STORAGE_KEY }=require('./hlm-browser-save-adapter');
function storage(seed={}){const d={...seed};return{getItem:k=>Object.prototype.hasOwnProperty.call(d,k)?d[k]:null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>{delete d[k]}}}
const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
let r=inspectRuntimeMigrationReadiness(storage());
assert.strictEqual(r.ready,false); assert(r.blockers.includes('LEGACY_SOURCE_NOT_FOUND'));
r=inspectRuntimeMigrationReadiness(storage({[LEGACY_STORAGE_KEY]:'{bad'}));
assert.strictEqual(r.ready,false); assert(r.blockers.includes('INVALID_LEGACY_SOURCE_JSON'));
const raw=JSON.stringify(legacy);
r=inspectRuntimeMigrationReadiness(storage({[LEGACY_STORAGE_KEY]:raw}));
assert.strictEqual(r.ready,true); assert.strictEqual(r.planValid,true);
r=inspectRuntimeMigrationReadiness(storage({[LEGACY_STORAGE_KEY]:raw,[DEFAULT_STORAGE_KEY]:'existing'}));
assert.strictEqual(r.ready,true); assert(r.warnings.includes('NEW_SAVE_NAMESPACE_ALREADY_PRESENT'));
console.log('Runtime migration preflight tests passed.');
