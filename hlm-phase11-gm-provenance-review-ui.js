/* Mission 1276: responsive, read-only human GM provenance review interface. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-provenance-checkpoints'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMProvenanceReviewUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function render(container,ledger,sources,approved){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const engine=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMProvenanceCheckpoints);
 if(!engine||typeof engine.prepare!=='function')throw Error('Provenance engine unavailable');
 const model=engine.prepare(ledger,sources,approved);
 const doc=container.ownerDocument;
 const element=(tag,text,cls)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
 const main=element('section',undefined,'gm-provenance-review');
 main.setAttribute('aria-label','Experimental human GM source provenance review');
 main.append(element('h2','Human GM source review'),element('p',model.warning,'gm-provenance-warning'));
 const status=element('p','Independent review pending. No evidence verified.','gm-provenance-status');
 status.setAttribute('role','status');main.append(status);
 const list=element('div',undefined,'gm-provenance-list');
 for(const entry of model.entries){
  const card=element('article',undefined,'gm-provenance-card');
  card.append(element('h3','Task '+entry.taskId),element('p','Uncertainty: '+entry.uncertainty));
  const details=element('dl');
  for(const [label,value] of [['Source ID',entry.provenance?.sourceId||'Not supplied'],['Source location',entry.provenance?.sourceLocation||'Not supplied'],['Source date',entry.provenance?.sourceDate||'Not supplied']]){
   details.append(element('dt',label),element('dd',value));
  }
  card.append(details,element('h4','Evidence gaps'));
  const gaps=element('ul');for(const gap of entry.missingEvidence)gaps.append(element('li',gap));card.append(gaps);
  card.append(element('h4','Independent review actions'));
  const actions=element('ol');for(const cp of entry.checkpoints)actions.append(element('li',cp.id+': '+cp.state));card.append(actions);
  list.append(card);
 }
 main.append(list);container.replaceChildren(main);return model;
}
return {render};
});