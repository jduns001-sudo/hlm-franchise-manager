'use strict';
const assert=require('assert');
const { evaluatePhase2ExitGate }=require('./hlm-phase2-exit-gate');

const automated={
  gameStateEnvelope:true,serializationRoundTrip:true,saveEnvelopeIntegrity:true,
  saveRepository:true,browserPersistence:true,backupImportExport:true,
  migrationSafety:true,rollbackRecovery:true,exactCandidateBinding:true,
  deployedReadIntegration:true
};
const physical={
  frontOfficeLoads:true,teamSelectionWorks:true,rosterWorks:true,linesWork:true,
  playerInformationCorrect:true,contractsWork:true,draftPicksCorrect:true,
  prospectsWork:true,noConsoleErrors:true,saveSucceeds:true,reloadSucceeds:true,
  stateUnchangedAfterReload:true,noUnrelatedScreensBroken:true,githubPagesFunctional:true
};

const passed=evaluatePhase2ExitGate({automated,physical});
assert.strictEqual(passed.ready,true);
assert.strictEqual(passed.phase3MayBegin,true);
assert.strictEqual(passed.nextPhase,3);
assert.deepStrictEqual(passed.blockers,[]);

const missingPhysical={...physical,githubPagesFunctional:false};
const blocked=evaluatePhase2ExitGate({automated,physical:missingPhysical});
assert.strictEqual(blocked.ready,false);
assert.strictEqual(blocked.phase3MayBegin,false);
assert.strictEqual(blocked.nextPhase,null);
assert(blocked.blockers.includes('PHYSICAL_CHECK_REQUIRED:githubPagesFunctional'));

const automatedOnly=evaluatePhase2ExitGate({automated});
assert.strictEqual(automatedOnly.automatedChecksPassed,true);
assert.strictEqual(automatedOnly.physicalChecksPassed,false);
assert.strictEqual(automatedOnly.phase3MayBegin,false);

console.log('Phase 2 exit gate tests passed.');
