'use strict';
const {mapExternalRoster,createVersionedImportStore}=require('./hlm-phase11-roster-mapping');
function createRosterImportController(storage){
 const store=createVersionedImportStore(storage);
 let stagedText=null;
 function preview(input){
  stagedText=null;
  if(typeof input!=='string'||input.length>5_000_000)throw new Error('Import exceeds 5MB');
  let source;try{source=JSON.parse(input)}catch(e){throw new Error('Invalid JSON input')}
  const normalized=source.format==='hlm-phase11-roster-import-v1'?input:mapExternalRoster(source);
  const summary=store.preview(normalized);
  stagedText=normalized;
  return summary;
 }
 function commit(confirm){
  if(!stagedText)throw new Error('Preview a roster before saving');
  const result=store.commit(stagedText,{confirm:confirm===true});
  stagedText=null;
  return result;
 }
 return {preview,commit,load:store.load,key:store.key};
}
module.exports={createRosterImportController};
