'use strict';
// Mission 524: attach deterministic, content-sensitive integrity fingerprints to a verified audit bundle.
const {buildGameBatchAuditBundle}=require('./hlm-phase9-batch-audit-bundle');
function fingerprint(value){
 const bytes=new TextEncoder().encode(value);
 let hash=2166136261;
 for(const byte of bytes){hash^=byte;hash=Math.imul(hash,16777619);}
 return 'fnv1a32:'+((hash>>>0).toString(16).padStart(8,'0'))+':'+bytes.length;
}
function createGameBatchAuditManifest({storage,receipt}={}){
 const bundle=buildGameBatchAuditBundle({storage,receipt});
 const manifest=Object.freeze({
  kind:'phase9-game-batch-audit-manifest',version:1,
  verified:true,gameCount:bundle.gameCount,
  jsonFingerprint:fingerprint(bundle.json),
  csvFingerprint:fingerprint(bundle.csv),
  textFingerprint:fingerprint(bundle.text),
  persistencePerformed:false
 });
 return Object.freeze({manifest,bundle});
}
function verifyGameBatchAuditManifest({manifest,bundle}={}){
 const errors=[];
 if(!manifest||manifest.kind!=='phase9-game-batch-audit-manifest'||manifest.version!==1||
 !bundle||bundle.kind!=='phase9-game-batch-audit-bundle'||bundle.verified!==true)
 errors.push('AUDIT_MANIFEST_INVALID');
 else{
  if(manifest.gameCount!==bundle.gameCount)errors.push('AUDIT_MANIFEST_GAME_COUNT_MISMATCH');
  for(const format of ['json','csv','text'])
   if(manifest[format+'Fingerprint']!==fingerprint(bundle[format]))
    errors.push('AUDIT_MANIFEST_'+format.toUpperCase()+'_MISMATCH');
 }
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),
  persistencePerformed:false});
}
module.exports={createGameBatchAuditManifest,verifyGameBatchAuditManifest};
