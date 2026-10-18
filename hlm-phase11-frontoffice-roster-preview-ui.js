/* Experimental Front Office read-only preview UI, manually opened, no save writes. */
(function(root){
'use strict';
function mount(getDb){if(typeof getDb!=='function')throw Error('Read-only Front Office source required');if(!root.HLMFrontOfficeRosterBridge)throw Error('Roster bridge unavailable');if(root.document.getElementById('hlm-preview-launcher'))return;
const launcher=root.document.createElement('button');launcher.id='hlm-preview-launcher';launcher.type='button';launcher.textContent='Preview roster (read only)';launcher.setAttribute('aria-label','Open read-only roster preview');Object.assign(launcher.style,{position:'fixed',right:'12px',bottom:'12px',zIndex:'9999',minHeight:'44px',padding:'10px',background:'#153759',color:'#fff',border:'1px solid #78a6d4',borderRadius:'8px'});
const panel=root.document.createElement('section');panel.id='hlm-preview-panel';panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Experimental roster preview');Object.assign(panel.style,{position:'fixed',right:'12px',bottom:'68px',width:'min(360px, calc(100vw - 24px))',maxHeight:'65vh',overflow:'auto',zIndex:'9999',background:'#102035',color:'#fff',padding:'14px',border:'1px solid #78a6d4',borderRadius:'8px'});
const heading=root.document.createElement('h2');heading.textContent='Read-only roster preview';panel.appendChild(heading);
const message=root.document.createElement('p');message.id='hlm-preview-status';message.textContent='Not activated. Your saves are unchanged.';panel.appendChild(message);
const approve=root.document.createElement('button');approve.type='button';approve.textContent='I approve preview';approve.style.minHeight='44px';panel.appendChild(approve);
const close=root.document.createElement('button');close.type='button';close.textContent='Close';close.style.minHeight='44px';panel.appendChild(close);
launcher.addEventListener('click',()=>{panel.hidden=false;message.textContent='Not activated. Your saves are unchanged.'});
close.addEventListener('click',()=>{panel.hidden=true});
approve.addEventListener('click',()=>{try{const p=root.HLMFrontOfficeRosterBridge.preview(getDb(),{humanApproved:true});message.textContent=p.universe.teams.length+' teams, '+p.universe.players.length+' assigned active players. '+p.excludedUnknownTeamCount+' imported players excluded for unknown team IDs ('+(p.importedTeamClassification?p.importedTeamClassification.retiredUnknownTeam+' retired, '+p.importedTeamClassification.activeUnknownTeam+' unresolved active':'classification unavailable')+'). Controlled team '+p.meta.controlledTeamId+'. Preview only. No save changes.'}catch(e){message.textContent='Preview unavailable: '+String(e.message).slice(0,160)}});
root.document.body.appendChild(panel);root.document.body.appendChild(launcher);}
root.HLMFrontOfficeRosterPreviewUI=Object.freeze({mount});
})(typeof globalThis!=='undefined'?globalThis:this);
