'use strict';

function freeze(value) { return Object.freeze(value); }
function numberOrNull(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function resolvePotentialRevisionEvidence(input = {}) {
  const actualPotential = input.potential ?? null;
  const potentialLevel = input.potentialLevel ?? null;
  const confidence = numberOrNull(input.potentialConfidence);
  const evaluation = input.developmentEvaluation ?? null;
  return freeze({
    actualPotential,
    potentialLevel,
    confidence,
    developmentStatus: evaluation ? evaluation.pace ?? null : null,
    developmentDirection: evaluation ? evaluation.direction ?? null : null,
    revisionReady: actualPotential !== null && evaluation !== null,
    scoutingLagSupported: true,
    revisedPotential: null
  });
}

function resolveGoalieDevelopmentProfile(input = {}) {
  const position = String(input.position ?? '').trim().toUpperCase();
  const goalie = position === 'G' || position === 'GOALIE';
  return freeze({
    goalie,
    specializedMaturityRequired: goalie,
    specializedFactorsRequired: goalie,
    maturityAdjustment: null,
    factorAdjustments: null
  });
}

function resolveDevelopmentDecisionReadiness(input = {}) {
  const promotion = input.promotion ?? {};
  const setbacks = input.setbacks ?? {};
  const retirement = input.retirement ?? {};
  const hasPromotionEvidence = [promotion.ability, promotion.development, promotion.age, promotion.performance, promotion.league, promotion.organizationalDepth, promotion.contract, promotion.morale].some(value => value !== null && value !== undefined);
  const hasSetbackEvidence = (Array.isArray(setbacks.injuries) && setbacks.injuries.length > 0) ||
    [setbacks.coachingFit, setbacks.limitedPlayingTime, setbacks.poorPerformance, setbacks.confidence, setbacks.personalityConflicts].some(value => value !== null && value !== undefined);
  const hasRetirementEvidence = retirement.retired === true || [retirement.age, retirement.decliningAbility, retirement.contract, retirement.careerSatisfaction, retirement.personalDecision].some(value => value !== null && value !== undefined);
  return freeze({
    promotion: freeze({ evidenceReady: hasPromotionEvidence, decision: null }),
    setback: freeze({ evidenceReady: hasSetbackEvidence, decision: null }),
    retirement: freeze({ evidenceReady: hasRetirementEvidence, decision: null })
  });
}

function createDevelopmentHistoryEvent(input = {}) {
  const allowed = ['draft-status', 'promotion', 'breakout', 'setback', 'award', 'milestone'];
  if (!allowed.includes(input.type) || input.playerId === null || input.playerId === undefined || !input.date) return null;
  return freeze({
    kind: 'development-history-event',
    version: 1,
    playerId: input.playerId,
    date: input.date,
    type: input.type,
    details: input.details ?? null,
    persistencePerformed: false
  });
}

module.exports = {
  resolvePotentialRevisionEvidence,
  resolveGoalieDevelopmentProfile,
  resolveDevelopmentDecisionReadiness,
  createDevelopmentHistoryEvent
};
