'use strict';
function closePhase8(input={}){
 const required=['foundationTestsPassed','integrationGatePassed','reviewsClear','sourceGameStateProtected','hiddenRealityProtected','phase9BoundaryPreserved'];
 const blockers=required.filter(k=>input[k]!==true);
 return Object.freeze({kind:'phase8-exit-closeout',version:1,closed:blockers.length===0,blockers:Object.freeze(blockers),nextPhase:9,
  scope:Object.freeze({phase:8,name:'Draft & Scouting',foundationComplete:blockers.length===0,fullFinalFeatureImplementation:false,liveDraftPersistenceActivated:false}),
  deferred:Object.freeze(['live-draft-selection-and-persistence','draft-lottery-mechanics','prospect-generation-formulas','cpu-draft-selection-weighting','persistent-scouting-progress','scout-staff-and-budget-effects','league-specific-draft-eligibility-and-order-rules','post-draft-contract-and-rights-processing']),
  guarantees:Object.freeze({sourceGameStateProtected:input.sourceGameStateProtected===true,hiddenRealityProtected:input.hiddenRealityProtected===true,phase9BoundaryPreserved:input.phase9BoundaryPreserved===true})});
}
module.exports={closePhase8};
