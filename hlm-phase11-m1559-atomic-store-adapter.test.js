'use strict';
const assert=require('node:assert/strict');
const {createIsolatedAtomicStore:create}=require('./hlm-phase11-m1559-atomic-store-adapter');
function storage(){const data=new Map();let writes=0;return {data,get writes(){return writes},getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>{writes++;data.set(k,v)}}}
const store=storage();store.data.set('hlm-m1559-isolated',JSON.stringify({meta:{revision:19},assets:{contracts:[]}}));store.data.set('hlm_front_office_v8','production-unchanged');
const adapter=create({storage:store,key:'hlm-m1559-isolated'});
assert.equal(adapter.read().meta.revision,19);
function check(expectedRevision,nextState,code){const result=adapter.compareAndSwap({expectedRevision,nextState});assert.equal(result.code,code);assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);assert.equal(store.writes,0);assert.equal(store.getItem('hlm_front_office_v8'),'production-unchanged')}
check(19,{meta:{revision:20}},'atomic-storage-transaction-required');
check(18,{meta:{revision:19}},'stale-persisted-source');
check(19,{meta:{revision:21}},'invalid-revision-transition');
const production=create({storage:store,key:'hlm_front_office_v8'});assert.equal(production.read(),null);assert.equal(production.compareAndSwap({expectedRevision:19,nextState:{meta:{revision:20}}}).code,'isolated-storage-required');
store.data.set('hlm-m1559-isolated','{invalid');assert.equal(adapter.read(),null);assert.equal(adapter.compareAndSwap({expectedRevision:19,nextState:{meta:{revision:20}}}).code,'corrupt-persisted-source');
assert.equal(store.writes,0);
console.log('M1559 isolated storage CAS fail-closed Node tests passed');
