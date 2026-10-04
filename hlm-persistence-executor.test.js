'use strict';
const assert = require('assert');
const { createAtomicPersistencePlan, authorizeAtomicPersistencePlan } = require('./hlm-atomic-persistence');
const { executeAtomicPersistence } = require('./hlm-persistence-executor');
const { createMemorySaveRepository } = require('./hlm-save-repository');

const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
const draftPlan=createAtomicPersistencePlan(legacy,{saveId:'slot-a'});
const repo=createMemorySaveRepository();
assert.throws(()=>executeAtomicPersistence(draftPlan,repo,'slot-a'), e=>e.code==='PERSISTENCE_PLAN_NOT_AUTHORIZED');
assert.strictEqual(repo.has('slot-a'),false);

const plan=authorizeAtomicPersistencePlan(draftPlan,{explicitConfirmation:true});
const result=executeAtomicPersistence(plan,repo,'slot-a');
assert.strictEqual(result.executed,true);
assert.strictEqual(result.verified,true);
assert.strictEqual(result.legacySourcePreserved,true);
assert.strictEqual(repo.has('slot-a'),true);

assert.throws(()=>executeAtomicPersistence(plan,repo,'slot-a'), e=>e.code==='TARGET_SAVE_SLOT_EXISTS');
assert.strictEqual(repo.has('slot-a'),true);

const replacement=authorizeAtomicPersistencePlan(createAtomicPersistencePlan(legacy,{saveId:'slot-a'}),{explicitConfirmation:true,replaceExisting:true});
const replaced=executeAtomicPersistence(replacement,repo,'slot-a');
assert.strictEqual(replaced.executed,true);

const badRepo={
  data:null, save(k,v){this.data=v;}, load(){return '{"broken":true}';},
  has(){return this.data!==null;}, remove(){this.data=null;}
};
assert.throws(()=>executeAtomicPersistence(plan,badRepo,'slot-b'), e=>e.persistenceRolledBack===true);
assert.strictEqual(badRepo.data,null);
console.log('Persistence executor authorization tests passed.');
