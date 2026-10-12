'use strict';
// Mission 546: accessible opt-in diagnostics export panel. No automatic downloads.
const {prepareBrowserDiagnosticsDownloads,downloadPreparedDiagnosticsFile}=require('./hlm-phase9-browser-diagnostics-download-adapter');
function mountGameBatchDiagnosticsDownloadPanel({container,documentRef,urlRef,BlobCtor,diagnosticsArgs}={}){
 if(!container||typeof container.appendChild!=='function'||!documentRef||typeof documentRef.createElement!=='function')
  throw new TypeError('A container and browser document are required');
 const prepared=prepareBrowserDiagnosticsDownloads(diagnosticsArgs);
 const panel=documentRef.createElement('section');
 panel.setAttribute('aria-label','GM review diagnostics exports');
 const heading=documentRef.createElement('h3');
 heading.textContent='GM Review Diagnostics';
 panel.appendChild(heading);
 const status=documentRef.createElement('p');
 status.textContent=prepared.valid?'Review diagnostics ready':'Review diagnostics need attention';
 status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 panel.appendChild(status);
 const buttons=[];
 let disposed=false;
 for(const file of prepared.files){
  const button=documentRef.createElement('button');
  button.type='button';
  button.disabled=!prepared.valid;
  button.textContent='Download '+file.filename;
  button.addEventListener('click',()=>{
   if(!prepared.valid||disposed)return;
   try{
    downloadPreparedDiagnosticsFile(file,{documentRef,urlRef,BlobCtor});
    status.textContent='Downloaded '+file.filename;
   }catch(error){
    status.textContent='Download failed: '+(error&&error.message?error.message:'Unknown browser error');
   }
  });
  panel.appendChild(button);buttons.push(button);
 }
 container.appendChild(panel);
 return Object.freeze({valid:prepared.valid,buttonCount:buttons.length,
  dispose(){
   if(disposed)return false;
   disposed=true;
   for(const button of buttons)button.disabled=true;
   if(typeof panel.remove==='function')panel.remove();
   else if(typeof container.removeChild==='function')container.removeChild(panel);
   return true;
  },
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={mountGameBatchDiagnosticsDownloadPanel};
