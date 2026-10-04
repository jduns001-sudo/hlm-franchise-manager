'use strict';
const assert=require('assert');
const { prepareRuntimeMigration, confirmAndRunRuntimeMigration }=require('./hlm-runtime-integration-contract');
const { LEGACY_STORAGE_KEY }=require('./hlm-browser-persistence-integration');
const { DEFAULT_STORAGE_KEY }=require('./hlm-browser-save-adapter');
function storage(seed={}){const d={...seed};return{getItem:k=>Object.prototype.hasOwnProperty.call(d,k)?d[k]:null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>{delete d[k]}}}
const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
let s=storage(), p=prepareRuntimeMigration(s);
assert.strictEqual(p.preflight.ready,false); assert.strictEqual(p.command,null);
let run=confirmAndRunRuntimeMigration(p,s,true);
assert.strictEqual(run.result.executed,false); assert.strictEqual(run.result.reason,'PREFLIGHT_NOT_READY');

const raw=JSON.stringify(legacy); s=storage({[LEGACY_STORAGE_KEY]:raw}); p=prepareRuntimeMigration(s);
assert.strictEqual(p.preflight.ready,true); assert(p.command); assert.strictEqual(p.executable,false);
run=confirmAndRunRuntimeMigration(p,s,false);
assert.strictEqual(run.result.executed,false); assert.strictEqual(s.getItem(DEFAULT_STORAGE_KEY),null);
run=confirmAndRunRuntimeMigration(p,s,true);
assert.strictEqual(run.result.executed,true); assert.strictEqual(run.result.verified,true);
assert.strictEqual(s.getItem(LEGACY_STORAGE_KEY),raw); assert(s.getItem(DEFAULT_STORAGE_KEY));
console.log('Runtime integration contract tests passed.');
