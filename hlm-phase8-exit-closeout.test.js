'use strict';
const assert=require('assert');
const {closePhase8}=require('./hlm-phase8-exit-closeout');
const pass=closePhase8({foundationTestsPassed:true,integrationGatePassed:true,reviewsClear:true,sourceGameStateProtected:true,hiddenRealityProtected:true,phase9BoundaryPreserved:true});
assert.strictEqual(pass.closed,true);assert.deepStrictEqual(pass.blockers,[]);assert.strictEqual(pass.nextPhase,9);assert.strictEqual(pass.scope.phase,8);assert.strictEqual(pass.scope.name,'Draft & Scouting');assert.strictEqual(pass.scope.foundationComplete,true);assert.strictEqual(pass.scope.liveDraftPersistenceActivated,false);assert.strictEqual(pass.guarantees.hiddenRealityProtected,true);
for(const key of ['foundationTestsPassed','integrationGatePassed','reviewsClear','sourceGameStateProtected','hiddenRealityProtected','phase9BoundaryPreserved']){const input={foundationTestsPassed:true,integrationGatePassed:true,reviewsClear:true,sourceGameStateProtected:true,hiddenRealityProtected:true,phase9BoundaryPreserved:true};input[key]=false;const blocked=closePhase8(input);assert.strictEqual(blocked.closed,false);assert.ok(blocked.blockers.includes(key));assert.strictEqual(blocked.nextPhase,9);}
assert.ok(pass.deferred.includes('live-draft-selection-and-persistence'));console.log('Phase 8 exit closeout tests passed.');
