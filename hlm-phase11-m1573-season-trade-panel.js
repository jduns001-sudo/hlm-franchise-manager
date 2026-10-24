'use strict';
(function(){
 const by=id=>document.getElementById(id);
 const outgoing=by('season-trade-outgoing'),incoming=by('season-trade-incoming'),report=by('season-trade-report');
 if(!outgoing||!incoming||!report)return;
 let source,ready=false;
 function clear(message='Choose players from this saved season, then review. No changes saved.'){
  report.textContent=message;by('season-trade-cancel').disabled=true;
 }
 function selection(){clear();by('season-trade-review').disabled=!ready||!outgoing.value||!incoming.value}
 function refresh(){
  ready=false;clear();
  try{
   const result=source.choices();ready=result.ready;
   for(const [select,players] of [[outgoing,result.outgoing],[incoming,result.incoming]]){
    select.replaceChildren(new Option('Choose a player',''));
    for(const player of players)select.add(new Option(player.name+' — '+player.teamName+' ('+player.id+')',player.id));
    select.disabled=!ready||players.length===0;
   }
   clear(ready?'Saved '+result.teamName+' season roster loaded. Choose players to inspect source evidence. No trade has been approved.':'Create or resume an isolated season first. No trade has been approved.');
  }catch(error){outgoing.disabled=true;incoming.disabled=true;clear('Trade planning unavailable: '+error.message)}
  by('season-trade-review').disabled=true;
 }
 try{
  const manager=window.HLMIsolatedSingleGame.create(window.HLMPhase10,window.localStorage);
  source=window.HLMSeasonTradeSource.create(()=>manager.peek());
  by('season-trade-refresh').addEventListener('click',refresh);
  outgoing.addEventListener('change',selection);incoming.addEventListener('change',selection);
  by('season-trade-review').addEventListener('click',()=>{
   try{const result=source.review({outgoingPlayerId:outgoing.value,incomingPlayerId:incoming.value});
    report.textContent=result.players.map((p,i)=>(i===0?'Your player: ':'Player to acquire: ')+p.name+' ('+p.id+') — '+p.teamName+'\n'+
     (p.contractStatus==='source-active-contract'?'Saved active contract; annual cap charge '+(p.aav===null?'unavailable':p.aav.toLocaleString('en-US')):
      p.contractStatus==='ambiguous-active-contract'?'Multiple active contracts; source is ambiguous.':'Active contract unavailable from this saved season.')).join('\n\n')+'\n\n'+result.message;
    const check=source.preflight({outgoingPlayerId:outgoing.value,incomingPlayerId:incoming.value});
    const payroll=check.financial.map(t=>t.teamName+': '+(t.projectedPayroll===null?'payroll projection unavailable':
      'salary charge '+t.beforePayroll.toLocaleString('en-US')+' → '+t.projectedPayroll.toLocaleString('en-US')+
      ' (source cap '+t.capLimit.toLocaleString('en-US')+')')).join('\n');
    report.textContent+='\n\nSource-backed trade preflight (read-only)\n'+payroll+'\n'+
      (check.blockers.length?'Source blockers: '+check.blockers.join('; '):
      'Supplied source contract/cap/roster inputs pass the limited preflight; no approval is granted.')+
      '\n'+check.message;
    by('season-trade-cancel').disabled=false;
   }catch(error){clear('Review blocked: '+error.message);by('season-trade-review').disabled=true;}
  });
  by('season-trade-cancel').addEventListener('click',()=>clear('Declined player source review. No changes saved.'));
  window.addEventListener('storage',event=>{if(event.key===manager.key){ready=false;outgoing.disabled=true;incoming.disabled=true;by('season-trade-review').disabled=true;clear('Saved season changed in another tab. Refresh players and review again.')}});
  const output=by('output');if(output)new MutationObserver(refresh).observe(output,{childList:true,subtree:true,characterData:true});
  refresh();
 }catch{clear('Saved-season trade planning is unavailable. No changes saved.');by('season-trade-review').disabled=true;}
})();
