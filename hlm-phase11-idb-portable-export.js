'use strict';
/* Isolated durable backup export helper. Does not open or modify the production Front Office. */
const {FORMAT,validateSnapshot}=require('./hlm-phase11-indexeddb-backup');
const EXPORT_FORMAT='hlm-phase11-idb-portable-export-v1';
function encode(snapshot){
 validateSnapshot(snapshot);
 const copy=JSON.parse(JSON.stringify(snapshot));
 const envelope={format:EXPORT_FORMAT,sourceFormat:FORMAT,createdAt:new Date().toISOString(),snapshot:copy};
 const json=JSON.stringify(envelope);
 if(JSON.stringify(JSON.parse(json).snapshot)!==JSON.stringify(copy))throw Error('Backup serialization round-trip failed');
 return json;
}
function decode(text){
 if(typeof text!=='string'||text.length>25_000_000)throw Error('Invalid or oversized backup');
 let data;try{data=JSON.parse(text)}catch(e){throw Error('Invalid backup JSON')}
 if(!data||data.format!==EXPORT_FORMAT||data.sourceFormat!==FORMAT||typeof data.createdAt!=='string')throw Error('Unsupported backup format');
 return validateSnapshot(data.snapshot);
}
function exportForDownload(snapshot,saveFile){
 if(typeof saveFile!=='function')throw TypeError('Explicit download handler required');
 const json=encode(snapshot);
 const filename='hlm-phase11-full-franchise-backup.json';
 return Promise.resolve(saveFile({filename,mime:'application/json',contents:json})).then(result=>{
  if(result!==true)throw Error('Backup download not confirmed');
  return {filename,bytes:json.length,confirmed:true};
 });
}
module.exports={EXPORT_FORMAT,encode,decode,exportForDownload};
