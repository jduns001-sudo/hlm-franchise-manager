'use strict';
/* Isolated backup file verification. Caller owns file persistence and independent reopen. */
const {createHash}=require('node:crypto');
const {encode,decode}=require('./hlm-phase11-idb-portable-export');
const {validateSnapshot}=require('./hlm-phase11-indexeddb-backup');
const INTEGRITY_FORMAT='hlm-phase11-verified-file-v1';
function sha256(text){return createHash('sha256').update(text,'utf8').digest('hex')}
function canonical(value){return JSON.stringify(value)}
function packageSnapshot(snapshot){
 validateSnapshot(snapshot);
 const payload=encode(snapshot);
 return JSON.stringify({format:INTEGRITY_FORMAT,algorithm:'sha256',digest:sha256(payload),payload});
}
function verifyReopenedFile(text,expectedSnapshot){
 if(typeof text!=='string'||text.length>25_000_000)throw Error('Invalid or oversized backup file');
 let envelope;try{envelope=JSON.parse(text)}catch{throw Error('Backup file is not valid JSON')}
 if(!envelope||envelope.format!==INTEGRITY_FORMAT||envelope.algorithm!=='sha256'||typeof envelope.digest!=='string'||!/^[0-9a-f]{64}$/.test(envelope.digest)||typeof envelope.payload!=='string')throw Error('Unsupported backup file format');
 if(sha256(envelope.payload)!==envelope.digest)throw Error('Backup file integrity mismatch');
 const snapshot=decode(envelope.payload);
 if(expectedSnapshot!==undefined&&canonical(snapshot)!==canonical(validateSnapshot(expectedSnapshot)))throw Error('Reopened franchise state mismatch');
 return snapshot;
}
async function exportAndVerify(snapshot,writeFile,reopenFile){
 if(typeof writeFile!=='function'||typeof reopenFile!=='function')throw Error('Independent write and reopen handlers required');
 const filename='hlm-phase11-verified-franchise-backup.json',contents=packageSnapshot(snapshot);
 const saved=await writeFile({filename,mime:'application/json',contents});
 if(saved!==true)throw Error('Backup write not confirmed');
 const reopened=await reopenFile(filename);
 const verified=verifyReopenedFile(reopened,snapshot);
 return {filename,bytes:Buffer.byteLength(reopened,'utf8'),digest:sha256(reopened),verified:true,existed:verified.existed};
}
module.exports={INTEGRITY_FORMAT,packageSnapshot,verifyReopenedFile,exportAndVerify};
