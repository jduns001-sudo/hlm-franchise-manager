/* M1575: browser-only, opt-in external contract JSON inspection. Never saves. */
'use strict';
(function(){
 const el=id=>document.getElementById(id);
 const file=el('season-contract-file'),review=el('season-contract-review'),
  decline=el('season-contract-decline'),report=el('season-contract-report');
 if(!file||!review||!decline||!report)return;
 let intake=null,ready=false,epoch=0;
 const locked=message=>{
  epoch++;ready=false;file.value='';file.disabled=true;review.disabled=true;decline.disabled=true;
  try{intake?.discard()}catch{}report.textContent=message;
 };
 function refresh(){
  locked('Load a saved isolated season to inspect external contract evidence. Nothing imported.');
  try{
   if(!intake){
    const manager=window.HLMIsolatedSingleGame.create(window.HLMPhase10,window.localStorage);
    intake=window.HLMSeasonContractIntake.create(()=>manager.peek());
   }
   intake.begin();ready=true;file.disabled=false;
   report.textContent='Saved isolated franchise loaded. Select a source document for identity-checked inspection only. Nothing will be saved.';
  }catch(error){report.textContent='Contract inspection unavailable: '+error.message}
 }
 file.addEventListener('change',()=>{
  decline.disabled=true;report.textContent='Source selected; inspect to see validation. No file imported.';
  review.disabled=!ready||!file.files||file.files.length!==1;
 });
 review.addEventListener('click',async()=>{
  if(!ready||file.files?.length!==1)return;
  const document=file.files[0],ticket=++epoch;
  review.disabled=true;decline.disabled=true;
  report.textContent='Inspecting local evidence only. No save in progress.';
  try{
   if(document.size>2097152||document.size===0)throw Error('Evidence file must be between 1 byte and 2 MiB');
   const bytes=await document.arrayBuffer();
   if(!window.crypto?.subtle)throw Error('Secure browser SHA-256 support unavailable');
   const digest=await window.crypto.subtle.digest('SHA-256',bytes);
   const fingerprint=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
   const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
   if(ticket!==epoch)return;
   const details=intake.preview(parsed);
   if(ticket!==epoch)return;
   report.textContent=
    'Externally supplied source: '+details.sourcePublisher+' | Reference: '+details.sourceReference+' | As-of: '+details.sourceAsOfDate+'\n'+
    'SHA-256 file fingerprint (integrity only): '+fingerprint+'\n'+
    'Covered teams: '+details.coveredTeamCount+' | Covered active roster: '+details.coveredRosterCount+'\n'+
    'Identity-matched active contracts: '+details.matchedContractCount+
    ' | Already matching saved contracts: '+details.existingSavedMatchCount+
    ' | Missing covered roster contracts: '+details.missingCoveredRosterCount+'\n'+
    'Evidence coverage: '+(details.evidenceCompleteForDeclaredScope?'complete for declared scope only':'incomplete or conflicting')+'\n'+
    (details.blockers.length?'Blockers: '+details.blockers.join('; ')+'\n':'')+
    'Publisher authenticated: NO | Contracts imported: NO | Trades authorized: NO\n'+details.message;
   decline.disabled=false;
  }catch(error){
   if(ticket===epoch){report.textContent='External source inspection blocked: '+error.message+'. No file imported or saved.';decline.disabled=true;}
  }finally{if(ticket===epoch)review.disabled=!ready||file.files?.length!==1}
 });
 decline.addEventListener('click',()=>{
  epoch++;intake?.discard();file.value='';review.disabled=true;decline.disabled=true;
  report.textContent='Inspected evidence discarded. No contracts imported or saved. Refresh source inspection to try another file.';
  ready=false;file.disabled=true;
 });
 el('season-trade-refresh')?.addEventListener('click',refresh);
 const output=el('output');if(output)new MutationObserver(refresh).observe(output,{childList:true,subtree:true,characterData:true});
 window.addEventListener('storage',e=>{
  if(e.key==='hlm-phase11-m1340-isolated-single-game-v1')
   locked('Saved season changed in another tab. Refresh before inspecting another source document. No save performed.');
 });
 refresh();
})();
