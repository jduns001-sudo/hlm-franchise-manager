'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {selectDraftProspect}=require('./hlm-phase10-draft-selection');
/** Apply a caller-approved sequence of draft selections as one immutable transaction. */
function runOffseasonDraftWindow(state,selections=[]){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(selections))throw new TypeError('Draft selections must be an array');
  let current=state;
  const executed=[];
  for(const selection of selections){
    const result=selectDraftProspect(current,selection);
    current=result.nextState;
    executed.push(result.selection);
  }
  return {nextState:current===state?JSON.parse(JSON.stringify(state)):current,summary:{selections:executed,selectedCount:executed.length,remainingPicks:current.assets.draftPicks.filter(p=>p&&p.status!=='used'&&p.selectedProspectId==null).length}};
}
module.exports={runOffseasonDraftWindow};
