'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {authorizeSimulationPersistenceExecution,executeIsolatedSimulationPersistence,verifySimulationPersistenceExecution,verifyPersistedSimulationGameStateReload}=require('./hlm-simulation-persistence-execution');
function storage(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)};}
function fixture(){const candidateState=createGameStateEnvelope({meta:{currentDate:'2027-04-20'}});const readiness=Object.freeze({candidateState});
 const authorization=Object.freeze({candidateState});const pkg=Object.freeze({kind:'simulation-command-persistence-execution-package',version:1,packaged:true,executable:false,
 mode:'nextGame',days:3,fromDate:'2027-04-17',toDate:'2027-04-20',readiness,authorization,candidateState,
 transaction:Object.freeze({verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true})});
 return {candidateState,pkg,repository:createBrowserSaveAdapter(storage())};}
{const f=fixture(),authorization=authorizeSimulationPersistenceExecution({package:f.pkg,approved:true});
 const execution=executeIsolatedSimulationPersistence({package:f.pkg,authorization,repository:f.repository,slotId:'simulation-staging'});
 const verification=verifySimulationPersistenceExecution({execution});const reload=verifyPersistedSimulationGameStateReload({verification,repository:f.repository});
 assert.strictEqual(execution.executed,true);assert.strictEqual(execution.rolledBack,false);assert.strictEqual(verification.verified,true);assert.strictEqual(reload.verified,true);
 assert.strictEqual(reload.state.meta.currentDate,'2027-04-20');assert.strictEqual(f.repository.has('simulation-staging'),true);
 for(const x of [authorization,execution,verification,reload])assert.strictEqual(Object.isFrozen(x),true);}
{const f=fixture();assert.throws(()=>authorizeSimulationPersistenceExecution({package:f.pkg,approved:false}),e=>e.code==='SIMULATION_PERSISTENCE_EXECUTION_NOT_APPROVED');}
{const f=fixture(),a=authorizeSimulationPersistenceExecution({package:f.pkg,approved:true});f.repository.save('occupied',f.candidateState,{saveId:'occupied'});
 assert.throws(()=>executeIsolatedSimulationPersistence({package:f.pkg,authorization:a,repository:f.repository,slotId:'occupied'}),e=>e.code==='SIMULATION_PERSISTENCE_TARGET_OCCUPIED');}
{const f=fixture(),a=authorizeSimulationPersistenceExecution({package:f.pkg,approved:true});const bad={save(){},load(){throw new Error('bad write')},has(){return false},remove(){}};
 assert.throws(()=>executeIsolatedSimulationPersistence({package:f.pkg,authorization:a,repository:bad,slotId:'staging'}),e=>e.persistenceRolledBack===true);}
console.log('Unified simulation persistence execution tests passed.');