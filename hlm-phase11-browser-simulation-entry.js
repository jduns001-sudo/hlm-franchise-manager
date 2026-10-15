'use strict';
/* Bundled with esbuild into a browser global. Pure candidate states, no storage access. */
const {simulateNextDay}=require('./hlm-phase10-simulate-day');
const {advanceWithFinances}=require('./hlm-phase11-finance-state-commit');
const {validateGameStateEnvelope}=require('./hlm-game-state');
function preview(state,seed,teamIds,policies){
 if(!validateGameStateEnvelope(state).valid)throw Error('Invalid GameState');
 if(!Array.isArray(teamIds)||teamIds.length===0)throw Error('Select at least one team');
 const outcome=advanceWithFinances(state,seed,teamIds,policies,{confirmed:true});
 return {nextState:outcome.nextState,results:outcome.results,fromDate:outcome.fromDate,toDate:outcome.toDate};
}
module.exports={preview,simulateNextDay};
