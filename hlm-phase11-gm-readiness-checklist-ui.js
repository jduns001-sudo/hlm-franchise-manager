/* Mission 1284: accessible mobile checklist, separate preparation from verification. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-unified-human-review'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-discovery'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-workbench'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-private-handoff'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-readiness-checklist'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMReadinessChecklistUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(unifiedDep,discoveryDep,workbenchDep,handoffDep,checklistDep){
'use strict';
function mount(container,ledger,sources,approved,pageSize=10){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const g=typeof globalThis!=='undefined'?globalThis:{},unified=unifiedDep||g.HLMGMUnifiedHumanReview,discovery=discoveryDep||g.HLMGMReviewDiscovery,workbench=workbenchDep||g.HLMGMReviewWorkbench,handoff=handoffDep||g.HLMGMPrivateHandoff,checklist=checklistDep||g.HLMGMReadinessChecklist;
 if(!unified||!discovery||!workbench||!handoff||!checklist)throw Error('Review dependencies unavailable');
 const review=workbench.create(discovery.create(unified.create(ledger,sources,approved)),pageSize),session=checklist.create(handoff.create(review)),doc=container.ownerDocument;
 const el=(tag,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
 const root=el('section');root.className='gm-readiness-checklist';root.setAttribute('aria-label','Experimental human GM preparation checklist');
 root.append(el('h2','Human GM review preparation'),el('p','Completing preparation does not verify evidence, approve a decision or enable gameplay.'));
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');const list=el('fieldset');list.append(el('legend','Preparation steps'));const unresolved=el('section');unresolved.setAttribute('aria-label','Unresolved verification requirements');
 const exportLabel=el('label','Privacy-safe preparation summary'),output=el('textarea');output.readOnly=true;output.rows=10;output.setAttribute('aria-label','Privacy-safe preparation summary');
 function refresh(){
  const s=session.snapshot();status.textContent=s.preparedCount+' of '+s.totalSteps+' preparation steps complete. Independent verification pending.';
  unresolved.replaceChildren(el('h3','Still unresolved'));const ul=el('ul');for(const text of s.unresolved)ul.append(el('li',text));unresolved.append(ul);output.value=session.serialize();
 }
 for(const step of session.snapshot().steps){const row=el('label'),input=el('input');input.type='checkbox';input.setAttribute('aria-label',step.label);input.checked=step.prepared;input.addEventListener('change',()=>{session.setPrepared(step.id,input.checked);refresh()});row.append(input,doc.createTextNode(' '+step.label));list.append(row)}
 root.append(status,list,unresolved,exportLabel,output);refresh();container.replaceChildren(root);return session;
}
return {mount};
});