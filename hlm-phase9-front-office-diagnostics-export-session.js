'use strict';
// Mission 555: integration contract for browser download buttons.
// Uses a prepared diagnostics package supplied by the caller; never touches active saves.
const {createGameBatchDiagnosticsPanelController}=require('./hlm-phase9-browser-diagnostics-panel-controller');
function createFrontOfficeDiagnosticsExportSession({container,documentRef,urlRef,BlobCtor}={}){
 const controller=createGameBatchDiagnosticsPanelController({container,documentRef,urlRef,BlobCtor});
 return Object.freeze({
  show({storage,reviewPackageJson,originalAuditJson,receipt}={}){
   return controller.open({storage,json:reviewPackageJson,originalAuditJson,receipt});
  },
  hide(){return controller.close();},
  reset(){return controller.reset();},
  get status(){return controller.state;},
  get visible(){return controller.isOpen;},
  persistencePerformed:false,
  activeFranchiseSlotReplaced:false
 });
}
module.exports={createFrontOfficeDiagnosticsExportSession};
