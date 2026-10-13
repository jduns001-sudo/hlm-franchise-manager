'use strict';
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');
const {simulateControlledRosterDay}=require('./hlm-phase10-controlled-roster-day');

/**
 * Experimental roster-backed save transaction. Uses an isolated key and
 * never reads/writes existing Front Office or default Phase 10 saves.
 */
function createExperimentalRosterSaveStore(adapter,key='hlm-phase10-roster-experimental-v1'){
 if(typeof key!=='string'||!key.startsWith('hlm-phase10-roster-experimental-')){
  const error=new Error('An isolated experimental save key is required');
  error.code='INVALID_ROSTER_EXPERIMENTAL_SAVE_KEY';throw error;
 }
 const store=createFranchiseSaveStore(adapter,key);
 function advanceAndSave(seed=1){
  const current=store.load();
  if(!current)throw new Error('No experimental roster franchise save found');
  const result=simulateControlledRosterDay(current,seed,{experimental:true});
  if(result.advanced)store.save(result.nextState);
  return {...result,saved:result.advanced};
 }
 return {load:store.load,save:store.save,advanceAndSave,key};
}
module.exports={createExperimentalRosterSaveStore};
