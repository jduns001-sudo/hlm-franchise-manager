'use strict';

function evaluatePhase2ExitGate(input = {}) {
  const automated = input.automated || {};
  const physical = input.physical || {};

  const requiredAutomated = [
    'gameStateEnvelope',
    'serializationRoundTrip',
    'saveEnvelopeIntegrity',
    'saveRepository',
    'browserPersistence',
    'backupImportExport',
    'migrationSafety',
    'rollbackRecovery',
    'exactCandidateBinding',
    'deployedReadIntegration'
  ];
  const requiredPhysical = [
    'frontOfficeLoads',
    'teamSelectionWorks',
    'rosterWorks',
    'linesWork',
    'playerInformationCorrect',
    'contractsWork',
    'draftPicksCorrect',
    'prospectsWork',
    'noConsoleErrors',
    'saveSucceeds',
    'reloadSucceeds',
    'stateUnchangedAfterReload',
    'noUnrelatedScreensBroken',
    'githubPagesFunctional'
  ];

  const blockers = [];
  for (const key of requiredAutomated) {
    if (automated[key] !== true) blockers.push('AUTOMATED_CHECK_REQUIRED:' + key);
  }
  for (const key of requiredPhysical) {
    if (physical[key] !== true) blockers.push('PHYSICAL_CHECK_REQUIRED:' + key);
  }

  const ready = blockers.length === 0;
  return Object.freeze({
    kind: 'phase2-exit-gate',
    version: 1,
    phase: 2,
    phaseName: 'Game state/save system',
    ready,
    automatedChecksPassed: requiredAutomated.every(key => automated[key] === true),
    physicalChecksPassed: requiredPhysical.every(key => physical[key] === true),
    phase3MayBegin: ready,
    nextPhase: ready ? 3 : null,
    nextPhaseName: ready ? 'Season/calendar engine' : null,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { evaluatePhase2ExitGate };
