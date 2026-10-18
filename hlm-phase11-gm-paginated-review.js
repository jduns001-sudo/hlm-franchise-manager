/* Mission 1280: deterministic bounded pagination of an in-memory human GM review. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMPaginatedReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(discovery,pageSize=10){
 if(!discovery||typeof discovery.query!=='function'||typeof discovery.summary!=='function')throw Error('Discovery session required');
 if(!Number.isInteger(pageSize)||pageSize<1||pageSize>50)throw Error('Page size must be 1 to 50');
 let term='',filter='all',index=0;
 function page(){
  const ids=discovery.query(term,filter),pages=Math.max(1,Math.ceil(ids.length/pageSize));index=Math.max(0,Math.min(index,pages-1));
  return Object.freeze({taskIds:Object.freeze(ids.slice(index*pageSize,(index+1)*pageSize)),page:index+1,pages,totalFiltered:ids.length,pageSize,summary:discovery.summary(),hasPrevious:index>0,hasNext:index<pages-1,productionActivationAllowed:false,independentVerification:'pending'});
 }
 return Object.freeze({
  page,
  search(value){if(typeof value!=='string'||value.length>200)throw Error('Invalid search');term=value;index=0;return page()},
  filter(value){if(!['all','gaps','notes'].includes(value))throw Error('Invalid filter');filter=value;index=0;return page()},
  next(){if(page().hasNext)index++;return page()},
  previous(){if(page().hasPrevious)index--;return page()},
  goTo(value){if(!Number.isInteger(value)||value<1||value>page().pages)throw Error('Invalid page');index=value-1;return page()},
  inspect:id=>discovery.inspect(id),
  setNote:(id,note)=>{discovery.setNote(id,note);return page()},
  clearNote:id=>{discovery.clearNote(id);return page()},
  persistencePerformed:false,productionActivationAllowed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'
 });
}
return {create};
});