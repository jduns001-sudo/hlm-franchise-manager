(function(root){
 'use strict';
 // 401: safe browser-only read-only panel; 402: import validation;
 // 403: text search and section filter; 404: pagination and inspection;
 // 405: safe DOM rendering without HTML injection or transaction controls.
 function parseReviewExport(text){
  const payload=JSON.parse(text);
  if(!payload||payload.kind!=='cpu-review-export'||!Array.isArray(payload.rows)) throw new Error('Expected CPU review export JSON');
  if(payload.rows.length>10000) throw new Error('Too many review rows');
  const rows=payload.rows.map((x,i)=>{
   if(!x||typeof x!=='object'||typeof x.id!=='string'||typeof x.title!=='string'||typeof x.section!=='string') throw new Error('Invalid review row '+i);
   return Object.freeze({id:x.id.slice(0,200),title:x.title.slice(0,500),subtitle:String(x.subtitle??'').slice(0,1000),section:x.section.slice(0,100)});
  });
  return Object.freeze(rows);
 }
 function filterRows(rows,query,section,sort){
  const q=String(query??'').trim().toLowerCase();
  const filtered=rows.filter(x=>(section==='all'||x.section===section)&&(!q||[x.id,x.title,x.subtitle].some(v=>v.toLowerCase().includes(q))));
  return sort==='title'?filtered.slice().sort((a,b)=>a.title.localeCompare(b.title)):filtered;
 }
 if(typeof module!=='undefined'&&module.exports) module.exports={parseReviewExport,filterRows};
 if(!root.document) return;
 const doc=root.document,byId=id=>doc.getElementById(id);
 let rows=[],page=1,selected=null;const pageSize=10;
 function loadRows(next){rows=next;page=1;selected=null;byId('details').textContent='Select a decision to inspect it.';render();}
 function node(tag,cls,text){const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function render(){
  const filtered=filterRows(rows,byId('search').value,byId('section').value,byId('sort').value);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages);
  const list=byId('results');list.replaceChildren();
  for(const item of filtered.slice((page-1)*pageSize,page*pageSize)){
   const card=node('div','item');card.append(node('strong','',item.title),node('p','muted',item.subtitle),node('p','status',item.section));
   const inspect=node('button','','Inspect');inspect.type='button';inspect.addEventListener('click',()=>{selected=item;byId('details').textContent=item.title+'\n'+item.subtitle+'\n'+item.section+'\nReview only. No execution.';});
   card.append(inspect);list.append(card);
  }
  byId('status').textContent=filtered.length+' matching decisions ('+rows.length+' loaded)';
  byId('page').textContent='Page '+page+' of '+pages;
  byId('prev').disabled=page===1;byId('next').disabled=page===pages;
 }
 for(const id of ['search','section','sort'])byId(id).addEventListener(id==='search'?'input':'change',()=>{page=1;render();});
 byId('prev').addEventListener('click',()=>{page--;render();});
 byId('next').addEventListener('click',()=>{page++;render();});
 byId('file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{if(file.size>5000000)throw new Error('File exceeds 5 MB');loadRows(parseReviewExport(await file.text()));}
  catch(err){rows=[];page=1;render();byId('status').textContent='Import failed: '+err.message;}
 });
 // 406: paste JSON; 407: explicitly labeled sample; 408: filtered download;
 // 409: accessible status on import failures; 410: no mutation or transaction actions.
 byId('load-paste').addEventListener('click',()=>{try{loadRows(parseReviewExport(byId('paste').value));}catch(err){byId('status').textContent='Import failed: '+err.message;}});
 byId('demo').addEventListener('click',()=>{loadRows(parseReviewExport(JSON.stringify({kind:'cpu-review-export',rows:[{id:'sample-1',title:'Example cap review',subtitle:'Blocked: demonstration only',section:'Needs attention'},{id:'sample-2',title:'Example contract review',subtitle:'Awaiting human review (demo)',section:'Pending review'}]})));byId('status').textContent='DEMO DATA ONLY. No live franchise decisions loaded.';});
 byId('download').addEventListener('click',()=>{
  const matches=filterRows(rows,byId('search').value,byId('section').value,byId('sort').value);
  const blob=new Blob([JSON.stringify({kind:'cpu-review-export',version:1,rows:matches},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const link=node('a');link.href=url;link.download='cpu-review-filtered.json';doc.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
 });
 render();
})(typeof globalThis!=='undefined'?globalThis:this);
