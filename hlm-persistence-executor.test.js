'use strict';
const assert = require('assert');
const { createAtomicPersistencePlan } = require('./hlm-atomic-persistence');
const { executeAtomicPersistence } = require('./hlm-persistence-executor');
const { createMemorySaveRepository } = require('./hlm-save-repository');

const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
const plan=createAtomicPersistencePlan(legacy,{saveId:'slot-a'});
const repo=createMemorySaveRepository();
const result=executeAtomicPersistence(plan,repo,'slot-a');
assert.strictEqual(result.executed,true);
assert.strictEqual(result.verified,true);
assert.strictEqual(result.legacySourcePreserved,true);
assert.strictEqual(repo.has('slot-a'),true);

const badRepo={
  data:null, save(k,v){this.data=v;}, load(){return '{"broken":true}';},
  has(){return this.data!==null;}, remove(){this.data=null;}
};
assert.throws(()=>executeAtomicPersistence(plan,badRepo,'slot-b'), e=>e.persistenceRolledBack===true);
assert.strictEqual(badRepo.data,null);
console.log('Persistence executor tests passed.');
