'use strict';const assert=require('assert');const {closePhase7}=require('./hlm-phase7-exit-closeout');
const ok=closePhase7({foundationTestsPassed:true,integrationGatePassed:true,reviewsClear:true,sourceGameStateProtected:true,humanGMFinalAuthority:true,phase8BoundaryPreserved:true});
assert.strictEqual(ok.closed,true);assert.strictEqual(ok.nextPhase,8);assert.strictEqual(ok.scope.foundationComplete,true);assert.strictEqual(ok.scope.fullFinalFeatureImplementation,false);assert.strictEqual(ok.scope.liveTradePersistenceActivated,false);
const no=closePhase7({foundationTestsPassed:true});assert.strictEqual(no.closed,false);assert(no.blockers.includes('integrationGatePassed'));console.log('Phase 7 exit closeout tests passed.');
