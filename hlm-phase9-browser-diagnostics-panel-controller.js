'use strict';
// Mission 552: explicit lifecycle controller for the GM diagnostics export panel.
// The host never mounts automatically and does not alter franchise saves.
const {createGameBatchDiagnosticsPanelHost}=require('./hlm-phase9-browser-diagnostics-panel-host');
function createGameBatchDiagnosticsPanelController(browser){
 const host=createGameBatchDiagnosticsPanelHost(browser);
 let state='idle';
 return Object.freeze({
  open(diagnosticsArgs){
   const panel=host.mount(diagnosticsArgs);
   state=panel.valid?'ready':'attention';
   return Object.freeze({state,valid:panel.valid,buttonCount:panel.buttonCount});
  },
  close(){
   const removed=host.unmount();
   state='idle';
   return removed;
  },
  get state(){return state;},
  get isOpen(){return host.isMounted;},
  persistencePerformed:false,
  activeFranchiseSlotReplaced:false
 });
}
module.exports={createGameBatchDiagnosticsPanelController};
