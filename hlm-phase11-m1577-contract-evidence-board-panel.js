/* M1577: passive saved-season evidence readiness display; no import or save. */
'use strict';
(function(){
 const get=id=>document.getElementById(id),report=get('season-evidence-board-report'),refreshButton=get('season-evidence-board-refresh'),decline=get('season-evidence-board-decline');
 if(!report||!refreshButton||!decline)return;
 let board=null;
 function clear(message){
  try{board?.cancel()}catch{}
  report.textContent=message;decline.disabled=true;
 }
 function refresh(){
  try{
   if(!board){
    const manager=window.HLMIsolatedSingleGame.create(window.HLMPhase10,window.localStorage);
    board=window.HLMContractEvidenceBoard.create(()=>manager.peek());
   }
   const result=board.refresh();
   if(!result.ready){clear('Load an isolated franchise to inspect contract coverage. No save performed.');return}
   const review=board.review();
   const owner=window.HLMIsolatedSingleGame.create(window.HLMPhase10,window.localStorage).peek()?.meta?.controlledTeamId;
   const ordered=[...review.teams].sort((a,b)=>(String(a.teamId)===String(owner)?-1:0)-(String(b.teamId)===String(owner)?-1:0)||a.teamName.localeCompare(b.teamName));
   report.textContent='Saved-season contract evidence readiness (read-only)\n'+
    'Publisher authenticated: NO | Contract imports: NO | Trading authorized: NO\n'+
    ordered.map(t=>t.teamName+' ('+t.teamId+'): '+t.matched+'/'+t.roster+' roster contracts matched'+
     ' | payroll: '+(t.payroll===null?'unavailable':t.payroll)+
     ' | cap: '+(t.capLimit===null?'unavailable':t.capLimit)+
     ' | roster limit: '+(t.rosterLimit===null?'unavailable':t.rosterLimit)+
     ' | blockers: '+(t.blockers.length?t.blockers.join('; '):'No coverage blockers; source still unauthenticated')).join('\n')+
    '\n'+review.message;
   decline.disabled=false;
  }catch(e){clear('Evidence board blocked: '+e.message+'. No save performed.')}
 }
 refreshButton.addEventListener('click',refresh);
 decline.addEventListener('click',()=>clear('Evidence readiness review declined. No changes saved. Refresh to inspect again.'));
 get('season-trade-refresh')?.addEventListener('click',refresh);
 const output=get('output');if(output)new MutationObserver(refresh).observe(output,{childList:true,subtree:true,characterData:true});
 window.addEventListener('storage',e=>{if(e.key==='hlm-phase11-m1340-isolated-single-game-v1')clear('Saved franchise changed in another tab. Refresh evidence board. No changes saved.')});
 refresh();
})();
