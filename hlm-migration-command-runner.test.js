'use strict';
const assert=require('assert');
const { createMigrationCommand }=require('./hlm-migration-command');
const { runMigrationCommand }=require('./hlm-migration-command-runner');
const { MIGRATION_EVENT_TYPES }=require('./hlm-migration-events');
const { LEGACY_STORAGE_KEY }=require('./hlm-browser-persistence-integration');
function storage(seed={}){const d={...seed};return{getItem:k=>Object.prototype.hasOwnProperty.call(d,k)?d[k]:null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>{delete d[k]}}}
const cmd=createMigrationCommand('primary');
let run=runMigrationCommand(cmd,storage(),{confirmed:false});
assert.strictEqual(run.error,null);
assert.deepStrictEqual(run.events.map(e=>e.type),[MIGRATION_EVENT_TYPES.REQUESTED,MIGRATION_EVENT_TYPES.BLOCKED]);

const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
run=runMigrationCommand(cmd,storage({[LEGACY_STORAGE_KEY]:JSON.stringify(legacy)}),{confirmed:true});
assert.strictEqual(run.result.executed,true);
assert.deepStrictEqual(run.events.map(e=>e.type),[MIGRATION_EVENT_TYPES.REQUESTED,MIGRATION_EVENT_TYPES.COMPLETED]);

run=runMigrationCommand(cmd,storage({[LEGACY_STORAGE_KEY]:'{bad'}),{confirmed:true});
assert(run.error);
assert.deepStrictEqual(run.events.map(e=>e.type),[MIGRATION_EVENT_TYPES.FAILED]);
console.log('Migration command runner tests passed.');
