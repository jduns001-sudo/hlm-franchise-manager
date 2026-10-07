'use strict';
const assert=require('assert');const {evaluatePhase5ExitGate}=require('./hlm-phase5-exit-gate');
const automated={simulationInputBoundary:true,teamStrengthInputs:true,coreGameplayEvents:true,coreGameplayProfile:true,specialTeamsPenaltiesSituations:true,performanceInjuryOutputs:true,deterministicGameLoop:true,gameResultTransaction:true,timelineIntegration:true,persistenceBridge:true,sourceStateImmutability:true,deterministicReplay:true};
const physical={frontOfficeLoads:true,controlledTeamWorks:true,existingFranchiseScreensWork:true,saveReloadWorks:true,noNewConsoleErrors:true,githubPagesFunctional:true};
const pass=evaluatePhase5ExitGate({automated,physical});assert.strictEqual(pass.ready,true);assert.strictEqual(pass.phase6MayBegin,true);assert.strictEqual(pass.nextPhase,6);assert.deepStrictEqual(pass.blockers,[]);
const blocked=evaluatePhase5ExitGate({automated:{...automated,deterministicReplay:false},physical});assert.strictEqual(blocked.ready,false);assert.ok(blocked.blockers.includes('AUTOMATED_CHECK_REQUIRED:deterministicReplay'));
console.log('Phase 5 exit gate tests passed.');
