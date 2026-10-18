/* Mission 1282: mobile-first consolidated review with cross-page context. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-unified-human-review'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-discovery'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-workbench'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMReviewWorkbenchUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(unifiedDep,discoveryDep,workbenchDep){
'use strict';
function mount(container,ledger,sources,approved,pageSize=10){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const g=typeof globalThis!=='undefined'?globalThis:{},unified=unifiedDep||g.HLMGMUnifiedHumanReview,discovery=discoveryDep||g.HLMGMReviewDiscovery,workbench=workbenchDep||g.HLMGMReviewWorkbench;
 if(!unified||!discovery||!workbench)throw Error('Review dependencies unavailable');
 const session=workbench.create(discovery.create(unified.create(ledger,sources,approved)),pageSize),doc=container.ownerDocument;
 const el=(tag,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
 const root=el('section');root.className='gm-review-workbench';root.setAttribute('aria-label','Experimental human GM review workbench');
 root.append(el('h2','Human GM evidence workbench'),el('p','Cross-page evidence gaps are workload signals, not verified facts or approval decisions.'));
 const searchLabel=el('label','Search tasks'),search=el('input');search.type='search';search.maxLength=200;search.setAttribute('aria-label','Search tasks');
 const filterLabel=el('label','Filter tasks'),filter=el('select');filter.setAttribute('aria-label','Filter tasks');
 for(const [value,label] of [['all','All tasks'],['gaps','Evidence gaps'],['notes','Tasks with notes']]){const option=el('option',label);option.value=value;filter.append(option)}
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const summary=el('section');summary.setAttribute('aria-label','Cross-page evidence summary');
 const results=el('div'),nav=el('nav');nav.setAttribute('aria-label','Workbench pages');
 const previous=el('button','Previous page'),next=el('button','Next page'),counter=el('span');previous.type=next.type='button';nav.append(previous,counter,next);
 root.append(searchLabel,search,filterLabel,filter,status,summary,results,nav);
 function render(){
  const s=session.overview();
  status.textContent=s.matchingTasks+' matching tasks; '+s.unsavedNotes+' unsaved notes; '+s.verified+' verified. Human GM approval required.';
  summary.replaceChildren(el('p','All tasks: '+s.allTasks),el('p','High gap workload: '+s.priorityCounts.high),el('p','Medium gap workload: '+s.priorityCounts.medium),el('p','Low gap workload: '+s.priorityCounts.low),el('p','Missing evidence items: '+s.missingEvidenceItems),el('p','Independent verification: pending'));
  results.replaceChildren();
  for(const id of s.taskIds){
   const item=session.inspect(id),article=el('article');article.setAttribute('data-task-id',id);article.append(el('h3','Task '+id),el('p','Source requirement: '+item.sourceRequirement),el('p','Evidence gaps: '+item.missingEvidence.join('; ')));
   const noteLabel=el('label','Unsaved note for '+id),note=el('textarea');note.setAttribute('aria-label','Unsaved note for '+id);note.rows=2;note.maxLength=2000;note.value=item.note;
   note.addEventListener('input',()=>{session.setNote(id,note.value);const updated=session.overview();status.textContent=updated.matchingTasks+' matching tasks; '+updated.unsavedNotes+' unsaved notes; '+updated.verified+' verified. Human GM approval required.'});
   article.append(noteLabel,note);results.append(article);
  }
  counter.textContent=' Page '+s.page+' of '+s.pages+' ';previous.disabled=s.page===1;next.disabled=s.page===s.pages;
 }
 search.addEventListener('input',()=>{session.search(search.value);render()});filter.addEventListener('change',()=>{session.filter(filter.value);render()});
 previous.addEventListener('click',()=>{session.previous();render();previous.focus()});next.addEventListener('click',()=>{session.next();render();next.focus()});
 nav.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();session.previous();render()}else if(event.key==='ArrowRight'){event.preventDefault();session.next();render()}});
 render();container.replaceChildren(root);return session;
}
return {mount};
});