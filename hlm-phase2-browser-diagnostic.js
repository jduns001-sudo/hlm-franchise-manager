(function(root){
  'use strict';

  function cloneJson(value){ return JSON.parse(JSON.stringify(value)); }

  function summarize(snapshot){
    if(!snapshot || typeof snapshot!=='object' || Array.isArray(snapshot)){
      var e=new Error('Front Office state snapshot is invalid');
      e.code='INVALID_FRONT_OFFICE_SNAPSHOT';
      throw e;
    }
    var settings=snapshot.settings||snapshot.gmSettings||{};
    return Object.freeze({
      readable:true,
      readOnly:true,
      diagnosticOnly:true,
      persistenceEnabled:false,
      schema:snapshot.schema==null?null:snapshot.schema,
      playerCount:Array.isArray(snapshot.players)?snapshot.players.length:0,
      teamCount:Array.isArray(snapshot.teams)?snapshot.teams.length:0,
      contractCount:Array.isArray(snapshot.contracts)?snapshot.contracts.length:0,
      transactionCount:Array.isArray(snapshot.transactions)?snapshot.transactions.length:0,
      draftPickCount:Array.isArray(snapshot.draftPicks)?snapshot.draftPicks.length:0,
      controlledTeamId:settings.controlledTeamId==null?null:settings.controlledTeamId
    });
  }

  function createDiagnosticHook(readState){
    if(typeof readState!=='function') throw new TypeError('readState function is required');
    var running=false;
    return Object.freeze({
      kind:'hfm-phase2-browser-diagnostic',
      version:1,
      run:async function(){
        if(running){var e=new Error('Front Office diagnostic is already running');e.code='DIAGNOSTIC_ALREADY_RUNNING';throw e;}
        running=true;
        try{
          var source=await readState();
          return summarize(cloneJson(source));
        }finally{running=false;}
      }
    });
  }

  root.HFMPhase2Diagnostic=Object.freeze({createDiagnosticHook:createDiagnosticHook,summarize:summarize});
})(typeof window!=='undefined'?window:globalThis);
