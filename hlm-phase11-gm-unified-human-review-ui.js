/* Mission 1278: one mobile-friendly view of evidence gaps and unsaved review notes. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-unified-human-review'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMUnifiedHumanReviewUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function mount(container,ledger,sources,approved){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const engine=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMUnifiedHumanReview);
 if(!engine)throw Error('Unified review engine unavailable');
 const review=engine.create(ledger,sources,approved),doc=container.ownerDocument;
 const el=(tag,value)=>{const node=doc.createElement(tag);if(value!==undefined)node.textContent=String(value);return node};
 const root=el('section');root.className='gm-unified-review';root.setAttribute('aria-label','Experimental unified human GM review');
 root.append(el('h2','Human GM evidence and notes'),el('p','Experimental and unsaved. Sources are unverified. Notes never approve a decision.'));
 const status=el('p','Independent source verification pending');status.setAttribute('role','status');root.append(status);
 for(const entry of review.list()){
  const card=el('article');card.append(el('h3','Task '+entry.taskId),el('p','Source requirement: '+entry.sourceRequirement),el('p','Uncertainty: '+entry.uncertainty));
  const gapTitle=el('h4','Evidence gaps'),gaps=el('ul');for(const gap of entry.missingEvidence)gaps.append(el('li',gap));card.append(gapTitle,gaps);
  const checkpoints=el('ol');for(const checkpoint of entry.checkpoints)checkpoints.append(el('li',checkpoint.id+': '+checkpoint.state));card.append(el('h4','Independent review checkpoints'),checkpoints);
  const label=el('label','Unsaved note for '+entry.taskId),input=el('textarea');input.rows=4;input.maxLength=2000;input.setAttribute('aria-label','Unsaved note for '+entry.taskId);
  const clear=el('button','Clear note');clear.type='button';
  input.addEventListener('input',()=>{review.setNote(entry.taskId,input.value);status.textContent='Note edited locally. Evidence and approval remain unverified.'});
  clear.addEventListener('click',()=>{input.value='';review.clearNote(entry.taskId);status.textContent='Local note cleared. Independent review still pending.'});
  card.append(label,input,clear,el('p','Approval boundary: no verification, save or automatic GM action.'));root.append(card);
 }
 container.replaceChildren(root);return review;
}
return {mount};
});