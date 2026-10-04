'use strict';
const assert = require('assert');
const { createAtomicPersistencePlan, authorizeAtomicPersistencePlan } = require('./hlm-atomic-persistence');
const { executeBrowserPersistence, LEGACY_STORAGE_KEY } = require('./hlm-browser-persistence-integration');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');

function memoryStorage(seed={}) {
  const data={...seed};
  return { getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,
    setItem:(k,v)=>{data[k]=String(v);}, removeItem:k=>{delete data[k];}, dump:()=>({...data}) };
}
const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
const draftPlan=createAtomicPersistencePlan(legacy,{saveId:'browser-slot'});
const plan=authorizeAtomicPersistencePlan(draftPlan,{explicitConfirmation:true});
const legacyRaw=JSON.stringify(legacy);
const storage=memoryStorage({[LEGACY_STORAGE_KEY]:legacyRaw});
const result=executeBrowserPersistence(plan,storage,'browser-slot');
assert.strictEqual(result.verified,true);
assert.strictEqual(storage.getItem(LEGACY_STORAGE_KEY),legacyRaw);
assert(storage.getItem(DEFAULT_STORAGE_KEY));
assert.notStrictEqual(DEFAULT_STORAGE_KEY,LEGACY_STORAGE_KEY);
console.log('Browser persistence integration authorization tests passed.');
