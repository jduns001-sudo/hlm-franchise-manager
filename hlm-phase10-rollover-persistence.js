'use strict';
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');
const {completeOffseasonAndStartSeason}=require('./hlm-phase10-complete-offseason');
/** Commit an offseason rollover only after every step validates. */
function rolloverSavedFranchise(adapter,key,options){
  const store=createFranchiseSaveStore(adapter,key);
  const current=store.load();
  if(!current)throw new Error('No saved franchise state');
  const result=completeOffseasonAndStartSeason(current,options);
  store.save(result.nextState);
  return {nextState:store.load(),summary:result.summary};
}
module.exports={rolloverSavedFranchise};
