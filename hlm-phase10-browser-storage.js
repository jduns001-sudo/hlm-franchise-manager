'use strict';
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');

/**
 * Explicit browser localStorage adapter. Never accesses storage at import time.
 * The host must supply a Storage-compatible object.
 */
function createBrowserStorageAdapter(storage) {
  if (!storage || typeof storage.getItem!=='function' || typeof storage.setItem!=='function') {
    throw new TypeError('Storage must implement getItem and setItem');
  }
  return {
    read(key) {return storage.getItem(key);},
    write(key,value) {storage.setItem(key,value);}
  };
}
function createBrowserFranchiseSaveStore(storage,key='hlm-phase10-save') {
  return createFranchiseSaveStore(createBrowserStorageAdapter(storage),key);
}
module.exports={createBrowserStorageAdapter,createBrowserFranchiseSaveStore};
