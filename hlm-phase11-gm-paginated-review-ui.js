/* Mission 1280: keyboard-accessible paginated evidence review with volatile notes. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-unified-human-review'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-discovery'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-paginated-review'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMPaginatedReviewUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(unifiedDep,discoveryDep,pagingDep){
'use strict';
function mount(container,ledger,sources,approved,pageSize=10){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const unified=unifiedDep||(typeof globalThis!=='undefined'&&globalThis.HLMGMUnifiedHumanReview);
 const discovery=discoveryDep||(typeof globalThis!=='undefined'&&globalThis.HLMGMReviewDiscovery);
 const paging=pagingDep||(typeof globalThis!=='undefined'&&globalThis.HLMGMPaginatedReview);
 if(!unified||!discovery||!paging)throw Error('Review dependencies unavailable');
 const session=paging.create(discovery.create(unified.create(ledger,sources,approved)),pageSize),doc=container.ownerDocument;
 const el=(tag,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
 const root=el('section');root.className='gm-paginated-review';root.setAttribute('aria-label','Experimental paginated human GM review');
 root.append(el('h2','Human GM review queue'),el('p','Experimental and unsaved. Evidence remains unverified. Notes do not approve decisions.'));
 const label=el('label','Search tasks'),search=el('input');search.type='search';search.maxLength=200;search.setAttribute('aria-label','Search tasks');
 const filterLabel=el('label','Filter tasks'),filter=el('select');filter.setAttribute('aria-label','Filter tasks');
 for(const [value,name] of [['all','All tasks'],['gaps','Evidence gaps'],['notes','Tasks with notes']]){const opt=el('option',name);opt.value=value;filter.append(opt)}
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const list=el('div'),nav=el('nav');nav.setAttribute('aria-label','Review pages');
 const previous=el('button','Previous page'),next=el('button','Next page'),counter=el('span');previous.type=next.type='button';nav.append(previous,counter,next);
 root.append(label,search,filterLabel,filter,status,list,nav);
 const cards=new Map();
 for(const id of session.page().taskIds.concat([]))void id;
 function card(id){
  if(cards.has(id))return cards.get(id);
  const e=session.inspect(id),article=el('article');article.append(el('h3','Task '+id),el('p','Source requirement: '+e.sourceRequirement),el('p','Uncertainty: '+e.uncertainty),el('h4','Evidence gaps'));
  const gaps=el('ul');for(const gap of e.missingEvidence)gaps.append(el('li',gap));article.append(gaps,el('h4','Independent review checkpoints'));
  const checkpoints=el('ol');for(const cp of e.checkpoints)checkpoints.append(el('li',cp.id+': '+cp.state));article.append(checkpoints);
  const noteLabel=el('label','Unsaved note for '+id),note=el('textarea');note.setAttribute('aria-label','Unsaved note for '+id);note.rows=3;note.maxLength=2000;note.value=e.note;
  const clear=el('button','Clear note');clear.type='button';
  note.addEventListener('input',()=>{session.setNote(id,note.value);refresh()});
  clear.addEventListener('click',()=>{session.clearNote(id);note.value='';refresh()});
  article.append(noteLabel,note,clear,el('p','No approval, persistence or automatic GM action.'));cards.set(id,article);return article;
 }
 function refresh(){
  const p=session.page(),s=p.summary;
  status.textContent=p.totalFiltered+' matching tasks; '+s.withEvidenceGaps+' evidence gaps; '+s.withLocalNotes+' unsaved notes; '+s.verified+' verified. Human GM approval required.';
  counter.textContent=' Page '+p.page+' of '+p.pages+' ';previous.disabled=!p.hasPrevious;next.disabled=!p.hasNext;
  list.replaceChildren(...p.taskIds.map(card));
 }
 search.addEventListener('input',()=>{session.search(search.value);refresh()});filter.addEventListener('change',()=>{session.filter(filter.value);refresh()});
 previous.addEventListener('click',()=>{session.previous();refresh();previous.focus()});next.addEventListener('click',()=>{session.next();refresh();next.focus()});
 nav.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();session.previous();refresh()}else if(event.key==='ArrowRight'){event.preventDefault();session.next();refresh()}});
 refresh();container.replaceChildren(root);return session;
}
return {mount};
});