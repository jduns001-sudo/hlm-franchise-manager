(function(root){
  'use strict';

  var LEGACY_KEY='hlm_tracker_v3';

  function cloneJson(value){return JSON.parse(JSON.stringify(value));}

  function install(options){
    options=options||{};
    var storage=options.storage||root.localStorage;
    if(!storage||typeof storage.getItem!=='function') throw new TypeError('Web Storage-compatible storage is required');

    async function readLegacySnapshot(){
      var raw=storage.getItem(LEGACY_KEY);
      if(raw==null) return {};
      try{
        var parsed=JSON.parse(raw);
        return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?cloneJson(parsed):{};
      }catch(error){
        var e=new Error('Legacy Front Office state is not valid JSON');
        e.code='INVALID_LEGACY_FRONT_OFFICE_STATE';
        throw e;
      }
    }

    var integration=Object.freeze({
      kind:'front-office-deployed-read-integration',
      version:1,
      source:'legacy',
      defaultSource:'legacy',
      readSnapshot:readLegacySnapshot,
      automaticGameStateSelectionAllowed:false,
      browserStartupCutoverAllowed:false,
      frontOfficeActivationAllowed:false,
      frontOfficeActivationPerformed:false,
      persistenceWriteAllowed:false,
      legacySourceDeletionAllowed:false,
      gameStateReadEnabled:false
    });

    Object.defineProperty(root,'frontOfficeStateSource',{
      configurable:true,enumerable:false,writable:false,value:integration
    });
    return integration;
  }

  root.HFMFrontOfficeStateSource=Object.freeze({install:install,legacyStorageKey:LEGACY_KEY});
})(typeof window!=='undefined'?window:globalThis);
