(function(global){'use strict';
/* Production flag is hard-coded false. The mobile UI is a no-write safety preview. */
const PROD_ENABLED=false;
function mount(doc,dependencies){
 const root=doc.getElementById('phase11-activation-safety');if(!root)return;
 const button=doc.createElement('button');button.type='button';button.textContent='Check activation readiness (read only)';
 const result=doc.createElement('pre');result.setAttribute('role','status');result.textContent='Production activation is disabled. No save changes.';
 root.replaceChildren(button,result);
 button.onclick=async()=>{
  button.disabled=true;try{
   const {integration,finalGate,workbench,atomic,fetcher,storage}=dependencies;
   const file=doc.getElementById('reopen')?.files?.[0];
   if(!file)throw Error('Reopen the downloaded backup file first');
   const approval=doc.getElementById('activation-approval')?.value||'';
   if(approval!=='I AUTHORIZE PRODUCTION ROSTER IMPORT')throw Error('Type the exact GM approval phrase to preview readiness');
   const report=await finalGate.validate({integration,workbench,fetcher,storage,backupText:await file.text(),atomic});
   result.textContent=JSON.stringify({message:'Readiness checks passed. Production activation remains disabled.',addedPlayers:report.addedPlayers,controlledTeamId:report.controlledTeamId,productionWrites:0,activationEnabled:false},null,2);
  }catch(e){result.textContent='Blocked: '+e.message}finally{button.disabled=false}
 };
}
global.HLMPhase11MobileActivationSafety={mount,productionEnabled:PROD_ENABLED};
})(window);