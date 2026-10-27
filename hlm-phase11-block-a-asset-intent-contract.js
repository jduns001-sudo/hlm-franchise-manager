'use strict';
// Block A: explicit transaction intent contract, read-only and fail-closed.
// The public browser never signs, consumes CPU decisions or commits assets.
const crypto=require('node:crypto');
const {previewAtomicAssetDelta}=require('./hlm-phase11-block-a-atomic-asset-preview');
function buildProtectedAssetIntent(source,state,proposal,tradeInput,revision,decision,options={}){
 if(typeof revision!=='string'||!revision.trim()||revision.length>256)throw Error('Explicit authoritative revision reference required');
 const preview=previewAtomicAssetDelta(source,state,proposal,tradeInput,revision,decision,options);
 const manifest={
  schema:'hlm-block-a-asset-intent-v1',
  revision,
  assets:preview.changes,
  errors:preview.errors,
  blockers:preview.blockers
 };
 const digest=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
 return Object.freeze({
  schema:manifest.schema,
  revision,
  digest,
  manifest:JSON.parse(JSON.stringify(manifest)),
  status:'untrusted-intent-only',
  gmApprovalRequested:preview.gmApprovalRequested,
  independentlyAuthenticated:false,
  replayProtected:false,
  atomicCommitAvailable:false,
  settlementAuthorized:false,
  saved:false,
  experimental:true
 });
}
module.exports={buildProtectedAssetIntent};
