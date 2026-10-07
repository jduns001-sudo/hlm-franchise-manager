'use strict';
const assert=require('assert');
const {evaluatePhase5ExitGate}=require('./hlm-phase5-exit-gate');

const automated={
 simulationInputBoundary:true,teamStrengthInputs:true,coreGameplayEvents:true,coreGameplayProfile:true,
 specialTeamsPenaltiesSituations:true,performanceInjuryOutputs:true,deterministicGameLoop:true,
 gameResultTransaction:true,timelineIntegration:true,persistenceBridge:true,
 sourceStateImmutability:true,deterministicReplay:true
};
const physical={
 frontOfficeLoads:true,controlledTeamWorks:true,existingFranchiseScreensWork:true,
 saveReloadWorks:true,noNewConsoleErrors:true,githubPagesFunctional:true
};
const result=evaluatePhase5ExitGate({automated,physical});
assert.strictEqual(result.ready,true);
assert.strictEqual(result.automatedChecksPassed,true);
assert.strictEqual(result.physicalChecksPassed,true);
assert.strictEqual(result.phase6MayBegin,true);
assert.strictEqual(result.nextPhase,6);
assert.strictEqual(result.nextPhaseName,'Franchise management');
assert.deepStrictEqual(result.blockers,[]);
console.log('Phase 5 exit closeout passed: Phase 6 may begin.');
