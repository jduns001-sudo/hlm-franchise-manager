'use strict';
/* Offline, explicit backup-file verification. No IndexedDB writes or production activation. */
const {encode,decode}=require('./hlm-phase11-idb-portable-export');
function bytes(text){return new TextEncoder().encode(text)}
async function digest(text,cryptoApi){
 if(!cryptoApi||!cryptoApi.subtle||typeof cryptoApi.subtle.digest!=='function')throw Error('WebCrypto SHA-256 required');
 const result=await cryptoApi.subtle.digest('SHA-256',bytes(text));
 return Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');
}
async function prepareBackupFile(snapshot,cryptoApi){
 const text=encode(snapshot);
 const hash=await digest(text,cryptoApi);
 return {filename:'hlm-phase11-full-franchise-backup.json',contents:text,sha256:hash,bytes:bytes(text).length};
}
async function verifyBackupFile(reopenedText,expected,cryptoApi){
 if(typeof reopenedText!=='string'||!expected||typeof expected.sha256!=='string'||!Number.isSafeInteger(expected.bytes))throw Error('Expected backup receipt required');
 const actual=await digest(reopenedText,cryptoApi);
 if(actual!==expected.sha256||bytes(reopenedText).length!==expected.bytes)throw Error('Reopened backup file differs from exported backup');
 const snapshot=decode(reopenedText);
 return {verified:true,sha256:actual,bytes:expected.bytes,snapshot};
}
function createAuthorizationGate(){
 let verified=null;
 return {
  recordVerified(receipt){if(!receipt||receipt.verified!==true||typeof receipt.sha256!=='string')throw Error('Verified file receipt required');verified=receipt.sha256;return {backupVerified:true}},
  authorize({confirmed=false,sha256}={}){if(!verified||sha256!==verified||confirmed!==true)throw Error('Explicit GM approval and verified backup required');return {authorized:true,backupSha256:verified}},
  reset(){verified=null}
 };
}
module.exports={prepareBackupFile,verifyBackupFile,createAuthorizationGate};
