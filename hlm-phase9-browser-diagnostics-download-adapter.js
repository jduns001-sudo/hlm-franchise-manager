'use strict';
// Mission 545: opt-in browser download adapter for GM diagnostics exports.
// No download occurs until a caller explicitly invokes downloadPreparedDiagnosticsFile.
const {prepareGameBatchAuditReviewDiagnosticsDownloads}=require('./hlm-phase9-batch-audit-review-diagnostics-downloads');
function prepareBrowserDiagnosticsDownloads(args={}){
 const prepared=prepareGameBatchAuditReviewDiagnosticsDownloads(args);
 return Object.freeze({kind:'phase9-browser-gm-review-diagnostics-downloads',version:1,
  valid:prepared.valid,files:prepared.files,persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
function downloadPreparedDiagnosticsFile(file,{documentRef,urlRef,BlobCtor}={}){
 if(!file||typeof file.filename!=='string'||!/^gm-review-diagnostics(?:-package)?\.(?:json|csv|txt)$/.test(file.filename)||
  typeof file.content!=='string'||typeof file.mimeType!=='string')
  throw Object.assign(new TypeError('A prepared GM diagnostics export file is required'),{code:'INVALID_DIAGNOSTICS_DOWNLOAD_FILE'});
 if(!documentRef||!urlRef||!BlobCtor||typeof urlRef.createObjectURL!=='function'||
  typeof urlRef.revokeObjectURL!=='function'||typeof documentRef.createElement!=='function')
  throw Object.assign(new Error('Browser download APIs are required'),{code:'BROWSER_DOWNLOAD_UNAVAILABLE'});
 const blob=new BlobCtor([file.content],{type:file.mimeType});
 const href=urlRef.createObjectURL(blob);
 try{
  const anchor=documentRef.createElement('a');
  anchor.href=href;anchor.download=file.filename;
  if(typeof anchor.click!=='function')throw new Error('Browser download click is unavailable');
  anchor.click();
 }finally{urlRef.revokeObjectURL(href);}
 return Object.freeze({filename:file.filename,downloadTriggered:true,
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={prepareBrowserDiagnosticsDownloads,downloadPreparedDiagnosticsFile};
