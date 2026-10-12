'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {runOffseasonContractWindow}=require('./hlm-phase10-offseason-workflow');
const {selectDraftProspect}=require('./hlm-phase10-draft-selection');
const {beginNextSeason}=require('./hlm-phase10-next-season');
/** Execute approved offseason contracts, draft selections, and next season scheduling atomically. */
function completeOffseasonAndStartSeason(state,{contracts={},draftSelections=[],nextSeason}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(draftSelections))throw new TypeError('Draft selections must be an array');
  if(!nextSeason||typeof nextSeason!=='object')throw new TypeError('Next season configuration required');
  let current=runOffseasonContractWindow(state,contracts).nextState;
  const selections=[];
  for(const input of draftSelections){
    const result=selectDraftProspect(current,input);
    current=result.nextState;
    selections.push(result.selection);
  }
  const {nextState,summary}=beginNextSeason(current,nextSeason);
  return {nextState,summary:{season:summary,expiredContracts:contracts.expiredContractIds?.length??0,signings:contracts.signings?.length??0,draftSelections:selections}};
}
module.exports={completeOffseasonAndStartSeason};
