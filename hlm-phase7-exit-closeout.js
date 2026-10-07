'use strict';
function closePhase7(input={}){
 const required=['foundationTestsPassed','integrationGatePassed','reviewsClear','sourceGameStateProtected','humanGMFinalAuthority','phase8BoundaryPreserved'];
 const blockers=required.filter(k=>input[k]!==true);
 return Object.freeze({kind:'phase7-exit-closeout',version:1,closed:blockers.length===0,blockers:Object.freeze(blockers),nextPhase:8,
  scope:Object.freeze({phase:7,name:'Transactions & Trade Engine',foundationComplete:blockers.length===0,fullFinalFeatureImplementation:false,liveTradePersistenceActivated:false}),
  deferred:Object.freeze(['numeric-contextual-trade-valuation','automatic-cpu-offer-counteroffer-and-acceptance-behavior','league-specific-clause-cap-retention-and-transaction-rules','conditional-protected-pick-and-pick-swap-resolution','salary-retention-and-future-asset-candidate-mutation','live-trade-persistence','automatic-post-trade-consequence-application','rumor-reliability-and-deadline-decision-formulas','long-term-retrospective-outcome-analysis']),
  guarantees:Object.freeze({humanGMFinalAuthority:input.humanGMFinalAuthority===true,sourceGameStateProtected:input.sourceGameStateProtected===true,phase8BoundaryPreserved:input.phase8BoundaryPreserved===true})});
}
module.exports={closePhase7};
