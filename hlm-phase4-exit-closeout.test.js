'use strict';
const assert=require('assert');
const {evaluatePhase4ExitGate}=require('./hlm-phase4-exit-gate');

const automated={
 developmentInputs:true,factorModel:true,developmentCurves:true,developmentStages:true,developmentDirections:true,
 factorSignal:true,attributeSnapshot:true,overallRecalculationBoundary:true,attributeNormalization:true,
 attributeSpecificDirection:true,developmentEvaluation:true,developmentContext:true,lifecycleHistoryReporting:true,
 developmentChangePlan:true,developmentChangeRules:true,developmentGameStateTransaction:true,
 overallStrategyBoundary:true,timelineReadiness:true,scheduledEvaluationPackage:true,candidateVerification:true,
 potentialRevisionBoundary:true,goalieDevelopmentBoundary:true,decisionReadiness:true,historyEventBoundary:true,
 sourceStateImmutability:true,deterministicEvaluation:true
};
const physical={
 frontOfficeLoads:true,controlledTeamWorks:true,rosterWorks:true,linesWork:true,contractsWork:true,
 prospectsWork:true,draftPicksWork:true,saveReloadWorks:true,noNewConsoleErrors:true,githubPagesFunctional:true
};
const result=evaluatePhase4ExitGate({automated,physical});
assert.strictEqual(result.ready,true);
assert.strictEqual(result.automatedChecksPassed,true);
assert.strictEqual(result.physicalChecksPassed,true);
assert.strictEqual(result.phase5MayBegin,true);
assert.strictEqual(result.nextPhase,5);
assert.strictEqual(result.nextPhaseName,'Game simulation engine');
assert.deepStrictEqual(result.blockers,[]);
console.log('Phase 4 exit closeout passed: Phase 5 may begin.');
