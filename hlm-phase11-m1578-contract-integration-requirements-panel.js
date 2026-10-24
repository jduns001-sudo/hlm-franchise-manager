/* M1578: saved-season contract integration requirements, no import. */
'use strict';
(function(){
 const el=id=>document.getElementById(id),report=el('season-contract-requirements-report'),refresh=el('season-contract-requirements-refresh'),decline=el('season-contract-requirements-decline');
 if(!report||!refresh||!decline)return;
 let source;
 function clear(message){
  try{source?.cancel()}catch{}
  report.textContent=message;decline.disabled=true;
 }
 function inspect(){
  try{
   if(!source){
    const manager=window.HLMIsolatedSingleGame.create(window.HLMPhase10,window.localStorage);
    source=window.HLMContractIntegrationRequirements.create(()=>manager.peek(),window.HLMContractEvidenceBoard,window.HLMContractProvenanceReadiness);
   }
   const value=source.refresh();
   if(!value.ready){clear('Load an isolated franchise before reviewing integration requirements. No changes saved.');return}
   report.textContent='Saved-season contract integration requirements (read-only)\n'+
    'Teams: '+value.teamCount+' | Publisher authenticated: NO | GM import approval: NO | Contracts imported: NO | Trades authorized: NO\n'+
    'Missing requirements:\n'+value.blockers.map(x=>'• '+x).join('\n')+'\n'+value.message;
   decline.disabled=false;
  }catch(e){clear('Requirements review blocked: '+e.message+'. No changes saved.')}
 }
 refresh.addEventListener('click',inspect);
 decline.addEventListener('click',()=>clear('Contract integration requirements review declined. No changes saved.'));
 el('season-trade-refresh')?.addEventListener('click',inspect);
 const output=el('output');if(output)new MutationObserver(inspect).observe(output,{childList:true,subtree:true,characterData:true});
 window.addEventListener('storage',event=>{
  if(event.key==='hlm-phase11-m1340-isolated-single-game-v1')clear('Saved season changed in another tab. Refresh requirements. No changes saved.');
 });
 inspect();
})();
