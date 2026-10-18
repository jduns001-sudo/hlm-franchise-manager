/* Mission 1281: mobile evidence dashboard with accessible grouped task navigation. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-unified-human-review'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-discovery'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-paginated-review'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-evidence-dashboard'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMEvidenceDashboardUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(unifiedDep,discoveryDep,pagingDep,dashboardDep){
'use strict';
function mount(container,ledger,sources,approved,pageSize=10){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const g=typeof globalThis!=='undefined'?globalThis:{},unified=unifiedDep||g.HLMGMUnifiedHumanReview,discovery=discoveryDep||g.HLMGMReviewDiscovery,paging=pagingDep||g.HLMGMPaginatedReview,dashboard=dashboardDep||g.HLMGMEvidenceDashboard;
 if(!unified||!discovery||!paging||!dashboard)throw Error('Review dependencies unavailable');
 const session=dashboard.create(paging.create(discovery.create(unified.create(ledger,sources,approved)),pageSize)),doc=container.ownerDocument;
 const el=(tag,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
 const root=el('section');root.className='gm-evidence-dashboard';root.setAttribute('aria-label','Experimental human GM evidence dashboard');
 root.append(el('h2','Human GM evidence dashboard'),el('p','Evidence-gap workload priorities are not verification, approvals or gameplay recommendations.'));
 const searchLabel=el('label','Search tasks'),search=el('input');search.type='search';search.maxLength=200;search.setAttribute('aria-label','Search tasks');
 const filterLabel=el('label','Filter tasks'),filter=el('select');filter.setAttribute('aria-label','Filter tasks');
 for(const [value,label] of [['all','All tasks'],['gaps','Evidence gaps'],['notes','Tasks with notes']]){const option=el('option',label);option.value=value;filter.append(option)}
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const summary=el('div');summary.setAttribute('aria-label','Evidence review summary');
 const groups=el('div'),nav=el('nav');nav.setAttribute('aria-label','Dashboard pages');
 const previous=el('button','Previous page'),next=el('button','Next page'),counter=el('span');previous.type=next.type='button';nav.append(previous,counter,next);
 root.append(searchLabel,search,filterLabel,filter,status,summary,groups,nav);
 function render(){
  const s=session.snapshot(),p=session.page();
  status.textContent=s.totalFiltered+' matching tasks; '+s.allWithGaps+' tasks with gaps; '+s.allWithNotes+' unsaved notes; '+s.verified+' verified. Human GM decision required.';
  summary.replaceChildren(el('p','Visible evidence gaps: '+s.visibleEvidenceGaps),el('p','Visible local notes: '+s.visibleUnsavedNotes),el('p','Independent verification: pending'));
  groups.replaceChildren();
  for(const [tier,label] of [['high','High gap workload'],['medium','Medium gap workload'],['low','Low gap workload']]){
   const section=el('section');section.setAttribute('aria-label',label);section.append(el('h3',label+' ('+s.groups[tier].length+')'));
   for(const id of s.groups[tier]){
    const item=session.inspect(id),article=el('article');article.setAttribute('data-task-id',id);article.append(el('h4','Task '+id),el('p','Required source: '+item.sourceRequirement),el('p','Missing evidence: '+item.missingEvidence.join('; ')));
    const noteLabel=el('label','Unsaved note for '+id),note=el('textarea');note.setAttribute('aria-label','Unsaved note for '+id);note.maxLength=2000;note.rows=2;note.value=item.note;
    note.addEventListener('input',()=>{session.setNote(id,note.value);const updated=session.snapshot();status.textContent=updated.totalFiltered+' matching tasks; '+updated.allWithGaps+' tasks with gaps; '+updated.allWithNotes+' unsaved notes; '+updated.verified+' verified. Human GM decision required.';summary.replaceChildren(el('p','Visible evidence gaps: '+updated.visibleEvidenceGaps),el('p','Visible local notes: '+updated.visibleUnsavedNotes),el('p','Independent verification: pending'))});
    article.append(noteLabel,note);section.append(article);
   }groups.append(section);
  }
  counter.textContent=' Page '+p.page+' of '+p.pages+' ';previous.disabled=!p.hasPrevious;next.disabled=!p.hasNext;
 }
 search.addEventListener('input',()=>{session.search(search.value);render()});filter.addEventListener('change',()=>{session.filter(filter.value);render()});
 previous.addEventListener('click',()=>{session.previous();render();previous.focus()});next.addEventListener('click',()=>{session.next();render();next.focus()});
 nav.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();session.previous();render()}else if(event.key==='ArrowRight'){event.preventDefault();session.next();render()}});
 render();container.replaceChildren(root);return session;
}
return {mount};
});