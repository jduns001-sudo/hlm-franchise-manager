'use strict';
const {createBrowserStorageAdapter}=require('./hlm-phase10-browser-storage');
const {rolloverSavedFranchise}=require('./hlm-phase10-rollover-persistence');
/** Browser-facing offseason action, requiring an explicit Storage object. */
function rolloverBrowserFranchise(storage,options,key='hlm-phase10-save'){
  const adapter=createBrowserStorageAdapter(storage);
  return rolloverSavedFranchise(adapter,key,options);
}
module.exports={rolloverBrowserFranchise};
