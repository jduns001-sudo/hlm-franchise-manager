(function(root){
  'use strict';

  function installFrontOfficeDiagnostic(readState){
    if(!root.HFMPhase2Diagnostic || typeof root.HFMPhase2Diagnostic.createDiagnosticHook!=='function'){
      var missing=new Error('HFMPhase2Diagnostic browser bundle is required');
      missing.code='PHASE2_DIAGNOSTIC_BUNDLE_MISSING';
      throw missing;
    }
    if(typeof readState!=='function') throw new TypeError('readState function is required');

    var hook=root.HFMPhase2Diagnostic.createDiagnosticHook(readState);
    Object.defineProperty(root,'frontOfficeDiagnostic',{
      configurable:true,
      enumerable:false,
      writable:false,
      value:Object.freeze({
        kind:'front-office-live-read-diagnostic',
        version:1,
        readOnly:true,
        diagnosticOnly:true,
        persistenceEnabled:false,
        run:function(){ return hook.run(); }
      })
    });
    return root.frontOfficeDiagnostic;
  }

  root.HFMFrontOfficeDiagnostic=Object.freeze({
    install:installFrontOfficeDiagnostic
  });
})(typeof window!=='undefined'?window:globalThis);
