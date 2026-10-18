/* Mission 1277: responsive, local-only review editor. Never interprets notes as approval. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-local-review-workspace'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMLocalReviewWorkspaceUI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function mount(container,ledger,approved){
 if(!container||typeof container.replaceChildren!=='function')throw Error('DOM container required');
 const engine=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMLocalReviewWorkspace);
 if(!engine)throw Error('Local workspace engine unavailable');
 const workspace=engine.create(ledger,approved),doc=container.ownerDocument;
 const el=(tag,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=value;return n};
 const root=el('section');root.className='gm-local-workspace';root.setAttribute('aria-label','Experimental human GM local review workspace');
 root.append(el('h2','Human GM review notes'),el('p','Notes remain in memory only. No evidence is verified, no approval is granted, and nothing is saved.'));
 const state=el('p','Independent review required');state.setAttribute('role','status');root.append(state);
 for(const entry of workspace.list()){
  const article=el('article'),title=el('h3','Task '+entry.taskId),requirement=el('p','Required source: '+entry.sourceRequirement);
  const label=el('label','Local note for '+entry.taskId),textarea=el('textarea');textarea.maxLength=2000;textarea.rows=4;textarea.setAttribute('aria-label','Local note for '+entry.taskId);
  const clear=el('button','Clear unsaved note');clear.type='button';
  textarea.addEventListener('input',()=>{workspace.setNote(entry.taskId,textarea.value);state.textContent='Unsaved local note edited. Independent review remains pending.'});
  clear.addEventListener('click',()=>{textarea.value='';workspace.clear(entry.taskId);state.textContent='Unsaved local note cleared.'});
  article.append(title,requirement,label,textarea,clear,el('p','Approval boundary: editing a note never verifies a source or authorizes a GM decision.'));root.append(article);
 }
 container.replaceChildren(root);return workspace;
}
return {mount};
});