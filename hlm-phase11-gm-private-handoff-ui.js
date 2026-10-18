/* Mission 1283: accessible mobile handoff summary without local note contents. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-unified-human-review'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-discovery'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-workbench'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-private-handoff'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMPrivateHandoffUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(unifiedDep,discoveryDep,workbenchDep,handoffDep){
'use strict';
function mount(container,ledger,sources,approved,pageSize=10){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const g=typeof globalThis!=='undefined'?globalThis:{},unified=unifiedDep||g.HLMGMUnifiedHumanReview,discovery=discoveryDep||g.HLMGMReviewDiscovery,workbench=workbenchDep||g.HLMGMReviewWorkbench,handoff=handoffDep||g.HLMGMPrivateHandoff;
 if(!unified||!discovery||!workbench||!handoff)throw Error('Review dependencies unavailable');
 const session=workbench.create(discovery.create(unified.create(ledger,sources,approved)),pageSize),handoffSession=handoff.create(session),doc=container.ownerDocument;
 const el=(tag,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
 const root=el('section');root.className='gm-private-handoff';root.setAttribute('aria-label','Privacy-safe human GM review handoff');
 root.append(el('h2','Human GM evidence handoff'),el('p','This handoff contains counts only. No local note text, player identifiers, approvals or verified-evidence claims.'));
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const summary=el('section');summary.setAttribute('aria-label','Handoff summary');
 const checks=el('ol');checks.setAttribute('aria-label','Independent verification checkpoints');for(const item of handoffSession.checkpoints())checks.append(el('li',item));
 const exportLabel=el('label','Privacy-safe handoff JSON'),output=el('textarea');output.readOnly=true;output.rows=9;output.setAttribute('aria-label','Privacy-safe handoff JSON');
 const refresh=el('button','Refresh handoff');refresh.type='button';
 function render(){const s=handoffSession.summary();summary.replaceChildren(el('p','Tasks: '+s.allTasks),el('p','Missing evidence items: '+s.missingEvidenceItems),el('p','High gap workload: '+s.priorityCounts.high),el('p','Medium gap workload: '+s.priorityCounts.medium),el('p','Low gap workload: '+s.priorityCounts.low),el('p','Unsaved note count (contents excluded): '+s.unsavedNoteCount),el('p','Independent verification: pending'));output.value=handoffSession.serialize();status.textContent='Summary refreshed. No note contents exported. Human GM approval required.';}
 refresh.addEventListener('click',render);root.append(status,summary,el('h3','Verification checkpoints'),checks,exportLabel,output,refresh);render();container.replaceChildren(root);return Object.freeze({handoff:handoffSession,review:session,refresh:render});
}
return {mount};
}
);