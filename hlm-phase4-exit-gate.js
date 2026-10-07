'use strict';

function evaluatePhase4ExitGate(input = {}) {
  const automated = input.automated || {};
  const physical = input.physical || {};
  const requiredAutomated = [
    'developmentInputs','factorModel','developmentCurves','developmentStages','developmentDirections',
    'factorSignal','attributeSnapshot','overallRecalculationBoundary','attributeNormalization',
    'attributeSpecificDirection','developmentEvaluation','developmentContext','lifecycleHistoryReporting',
    'developmentChangePlan','developmentChangeRules','developmentGameStateTransaction',
    'overallStrategyBoundary','timelineReadiness','scheduledEvaluationPackage','candidateVerification',
    'potentialRevisionBoundary','goalieDevelopmentBoundary','decisionReadiness','historyEventBoundary',
    'sourceStateImmutability','deterministicEvaluation'
  ];
  const requiredPhysical = [
    'frontOfficeLoads','controlledTeamWorks','rosterWorks','linesWork','contractsWork',
    'prospectsWork','draftPicksWork','saveReloadWorks','noNewConsoleErrors','githubPagesFunctional'
  ];
  const blockers = [];
  for (const key of requiredAutomated) if (automated[key] !== true) blockers.push('AUTOMATED_CHECK_REQUIRED:' + key);
  for (const key of requiredPhysical) if (physical[key] !== true) blockers.push('PHYSICAL_CHECK_REQUIRED:' + key);
  const ready = blockers.length === 0;
  return Object.freeze({
    kind:'phase4-exit-gate',version:1,phase:4,phaseName:'Player development engine',ready,
    automatedChecksPassed:requiredAutomated.every(key => automated[key] === true),
    physicalChecksPassed:requiredPhysical.every(key => physical[key] === true),
    phase5MayBegin:ready,nextPhase:ready?5:null,nextPhaseName:ready?'Game simulation engine':null,
    blockers:Object.freeze(blockers),requiredAutomated:Object.freeze(requiredAutomated.slice()),
    requiredPhysical:Object.freeze(requiredPhysical.slice())
  });
}

module.exports = { evaluatePhase4ExitGate };
