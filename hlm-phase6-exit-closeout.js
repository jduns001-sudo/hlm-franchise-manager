'use strict';
const {createPhase6IntegrationExitGate}=require('./hlm-phase6-integration-exit-gate');
function createPhase6ExitCloseout(state,teamId,options={}){
 const gate=createPhase6IntegrationExitGate(state,teamId,options);
 if(!gate.passed){const e=new Error('Phase 6 integration exit gate must pass before closeout.');e.code='PHASE6_EXIT_GATE_FAILED';throw e;}
 return Object.freeze({kind:'phase-6-exit-closeout',version:1,phase:6,name:'Franchise Management',foundationComplete:true,
  integrationGatePassed:true,gate,deferredToLaterPhases:Object.freeze([
   'live franchise-action execution and persistence','full trade valuation, negotiation and execution','league-specific roster/waiver/contract formulas',
   'automatic buyout/release financial calculation','autonomous AI decision execution'
  ]),nextPhase:Object.freeze({phase:7,name:'Transactions & Trade Engine'}),sourceStateMutated:false,persistencePerformed:false});
}
module.exports={createPhase6ExitCloseout};
