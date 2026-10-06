'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');
const {createSimulationPersistenceReadiness,authorizeSimulationPersistence,createSimulationPersistenceExecutionPackage}=require('./hlm-simulation-persistence-preparation');
function fixture(mode='week',days=7){const state=createGameStateEnvelope({meta:{currentDate:'2027-04-24'}});
 const activation=Object.freeze({kind:'isolated-simulation-command-gamestate-activation',state});
 const verification=Object.freeze({kind:'simulation-command-gamestate-activation-verification',version:1,verified:true,candidateIdentityPreserved:true,authorizationLineageVerified:true,
 mode,days,fromDate:'2027-04-17',toDate:'2027-04-24',activation,state,eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
 return {state,verification};}
for(const [mode,days] of [['day',1],['threeDays',3],['week',7],['month',30],['nextGame',3],['nextEvent',1],['season',44]]){
 const f=fixture(mode,days),readiness=createSimulationPersistenceReadiness({verification:f.verification}),authorization=authorizeSimulationPersistence({readiness,approved:true}),
 pkg=createSimulationPersistenceExecutionPackage({readiness,authorization});assert.strictEqual(readiness.mode,mode);assert.strictEqual(readiness.days,days);
 assert.strictEqual(authorization.readiness,readiness);assert.strictEqual(pkg.candidateState,f.state);assert.strictEqual(pkg.executable,false);
 assert.strictEqual(pkg.transaction.verifyAfterWrite,true);assert.strictEqual(pkg.transaction.rollbackOnFailure,true);
 for(const x of [readiness,authorization,pkg])assert.strictEqual(Object.isFrozen(x),true);}
{const f=fixture(),r=createSimulationPersistenceReadiness({verification:f.verification});assert.throws(()=>authorizeSimulationPersistence({readiness:r,approved:false}),e=>e.code==='SIMULATION_PERSISTENCE_NOT_APPROVED');}
{const a=fixture(),b=fixture('threeDays',3),r1=createSimulationPersistenceReadiness({verification:a.verification}),r2=createSimulationPersistenceReadiness({verification:b.verification}),auth=authorizeSimulationPersistence({readiness:r1,approved:true});
 assert.throws(()=>createSimulationPersistenceExecutionPackage({readiness:r2,authorization:auth}),e=>e.code==='INVALID_SIMULATION_PERSISTENCE_EXECUTION_PACKAGE');}
console.log('Unified simulation persistence preparation tests passed.');