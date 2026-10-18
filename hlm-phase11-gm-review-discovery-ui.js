/* Mission 1279: accessible mobile search and filters without persistence or approval. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-unified-human-review'):null,typeof module==='object'&&module.exports?require('./hlm-phase11-gm-review-discovery'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMReviewDiscoveryUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(unifiedDep,discoveryDep){
'use strict';
function mount(container,ledger,sources,approved){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const unified=unifiedDep||(typeof globalThis!=='undefined'&&globalThis.HLMGMUnifiedHumanReview);
 const discovery=discoveryDep||(typeof globalThis!=='undefined'&&globalThis.HLMGMReviewDiscovery);
 if(!unified||!discovery)throw Error('Review dependencies unavailable');
 const session=discovery.create(unified.create(ledger,sources,approved)),doc=container.ownerDocument;
 const el=(tag,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
 const root=el('section');root.className='gm-review-discovery';root.setAttribute('aria-label','Human GM review discovery');
 root.append(el('h2','Human GM evidence review'),el('p','Experimental, local-only. Search and notes never verify sources or approve decisions.'));
 const controls=el('div');controls.className='gm-review-controls';
 const searchLabel=el('label','Search review tasks'),search=el('input');search.type='search';search.maxLength=200;search.setAttribute('aria-label','Search review tasks');
 const filterLabel=el('label','Evidence and note filter'),filter=el('select');filter.setAttribute('aria-label','Evidence and note filter');
 for(const [value,label] of [['all','All tasks'],['gaps','Evidence gaps'],['notes','Tasks with local notes']]){const option=el('option',label);option.value=value;filter.append(option)}
 controls.append(searchLabel,search,filterLabel,filter);root.append(controls);
 const summary=el('p');summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');root.append(summary);
 const list=el('div');list.className='gm-review-results';root.append(list);
 const cards=new Map();
 for(const entry of session.query()){
  const card=el('article');card.setAttribute('data-task-id',entry);
  const title=el('h3','Task '+entry),e=session.inspect(entry);
  card.append(title,el('p','Required source: '+e.sourceRequirement),el('p','Uncertainty: '+e.uncertainty),el('h4','Evidence gaps'));
  const gaps=el('ul');for(const gap of e.missingEvidence)gaps.append(el('li',gap));card.append(gaps,el('h4','Independent review checkpoints'));
  const checkpoints=el('ol');for(const cp of e.checkpoints)checkpoints.append(el('li',cp.id+': '+cp.state));card.append(checkpoints);
  const label=el('label','Unsaved note for '+entry),note=el('textarea');note.rows=3;note.maxLength=2000;note.setAttribute('aria-label','Unsaved note for '+entry);
  const clear=el('button','Clear note');clear.type='button';
  note.addEventListener('input',()=>{session.setNote(entry,note.value);refresh()});
  clear.addEventListener('click',()=>{session.clearNote(entry);note.value='';refresh()});
  card.append(label,note,clear,el('p','Approval boundary: pending independent verification; no save or automatic GM action.'));cards.set(entry,card);
 }
 function refresh(){
  const visible=session.query(search.value,filter.value),s=session.summary();
  summary.textContent=visible.length+' of '+s.total+' tasks shown; '+s.withEvidenceGaps+' with evidence gaps; '+s.withLocalNotes+' with unsaved notes; '+s.verified+' verified; human GM approval required.';
  list.replaceChildren(...visible.map(id=>cards.get(id)));
 }
 search.addEventListener('input',refresh);filter.addEventListener('change',refresh);refresh();container.replaceChildren(root);return session;
}
return {mount};
});