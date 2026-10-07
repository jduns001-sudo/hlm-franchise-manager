'use strict';const assert=require('assert');const {closePhase6}=require('./hlm-phase6-exit-closeout');
const ok=closePhase6({foundationTestsPassed:true,integrationGatePassed:true,reviewsClear:true,sourceGameStateProtected:true,humanGMFinalAuthority:true,phase7BoundaryPreserved:true});
assert.strictEqual(ok.closed,true);assert.strictEqual(ok.nextPhase,7);assert.strictEqual(ok.scope.fullFinalFeatureImplementation,false);assert.ok(ok.deferred.some(x=>x.includes('trade-request')));
const blocked=closePhase6({foundationTestsPassed:true});assert.strictEqual(blocked.closed,false);assert.strictEqual(blocked.nextPhase,null);assert.ok(blocked.blockers.length>0);
console.log('Phase 6 exit closeout tests passed.');
