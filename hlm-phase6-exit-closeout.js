'use strict';
function closePhase6(input={}){
 const required=['foundationTestsPassed','integrationGatePassed','reviewsClear','sourceGameStateProtected','humanGMFinalAuthority','phase7BoundaryPreserved'];
 const checks=Object.freeze(Object.fromEntries(required.map(k=>[k,input[k]===true])));
 const blockers=Object.freeze(required.filter(k=>!checks[k]));
 const closed=blockers.length===0;
 return Object.freeze({kind:'phase-6-exit-closeout',version:1,phase:6,phaseName:'Franchise management',closed,checks,blockers,
  nextPhase:closed?7:null,nextPhaseName:closed?'Transactions & Trade Engine':null,
  scope:Object.freeze({foundationComplete:closed,fullFinalFeatureImplementation:false,liveFranchiseMutationActivated:false}),
  deferred:Object.freeze([
   'Executable roster, waiver, release, buyout, contract and cap-rule mutations remain deferred until canonical league rules and persistence paths are supplied.',
   'Automatic buyout/release financial consequence calculations remain deferred.',
   'Player trade-request interaction workflow remains deferred.',
   'Trade Center execution, valuation, negotiation and CPU trade behavior belong to Phase 7.',
   'Franchise AI currently exposes factual/recommendation boundaries; autonomous decision formulas are not enabled.',
   'Line/depth/promise/trust canonical persistence and richer validation remain deferred.',
   'Owner employment effects, GM reputation formulas and permanent decision-history persistence remain deferred.'
  ])});
}
module.exports={closePhase6};
