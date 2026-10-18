'use strict';const assert=require('node:assert/strict');const {createStore}=require('./hlm-phase11-isolated-recovery-store');
let raw=null,fail=false;const memory={getItem(){return raw},setItem(k,v){if(fail)throw Error('Interrupted storage write');raw=v}};
const store=createStore(memory);assert.equal(store.loadRevision(),0);assert.equal(store.saveIfRevision({games:[]},0),true);assert.equal(store.loadRevision(),1);assert.equal(store.saveIfRevision({games:[1]},0),false);assert.deepEqual(store.load(),{games:[]});
fail=true;assert.throws(()=>store.saveIfRevision({games:[1]},1),/Interrupted/);assert.equal(store.loadRevision(),1);assert.deepEqual(store.load(),{games:[]});
fail=false;assert.equal(store.saveIfRevision({games:[1]},1),true);assert.equal(store.loadRevision(),2);
raw='{partial';assert.throws(()=>store.load(),/Interrupted or corrupt/);
console.log('Isolated interrupted-write and revision store regression passed');
