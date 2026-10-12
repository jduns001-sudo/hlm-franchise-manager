'use strict';
// Mission 550: reusable Front Office host contract for diagnostics panel.
// Caller explicitly mounts the panel; no automatic deployment or save writes.
const {mountGameBatchDiagnosticsDownloadPanel}=require('./hlm-phase9-browser-diagnostics-download-panel');
function createGameBatchDiagnosticsPanelHost({container,documentRef,urlRef,BlobCtor}={}){
 let mounted=null;
 return Object.freeze({
  mount(diagnosticsArgs){
   // Validate and construct the replacement before disposing the current panel.
   // A failed mount leaves the existing panel intact.
   const next=mountGameBatchDiagnosticsDownloadPanel({container,documentRef,urlRef,BlobCtor,diagnosticsArgs});
   const previous=mounted;
   mounted=next;
   if(previous)previous.dispose();
   return mounted;
  },
  unmount(){
   if(!mounted)return false;
   const old=mounted;mounted=null;return old.dispose();
  },
  get isMounted(){return mounted!==null;},
  persistencePerformed:false,
  activeFranchiseSlotReplaced:false
 });
}
module.exports={createGameBatchDiagnosticsPanelHost};
