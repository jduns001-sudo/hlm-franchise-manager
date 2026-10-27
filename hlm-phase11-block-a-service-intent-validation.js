'use strict';
// Protected service input validation only. Not a CPU verifier or settlement executor.
const crypto=require('node:crypto');
const SCHEMA='hlm-block-a-asset-intent-v1';
const hash=manifest=>crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
function validateAssetIntentEnvelope(intent,expectedRevision,options={}){
 const reasons=[];
 if(!intent||typeof intent!=='object'||Array.isArray(intent)||!intent.manifest||typeof intent.manifest!=='object')return Object.freeze({status:'rejected',reasons:Object.freeze(['invalid-intent']),settlementAuthorized:false,saved:false});
 const m=intent.manifest;
 if(intent.schema!==SCHEMA||m.schema!==SCHEMA)reasons.push('schema-mismatch');
 if(typeof expectedRevision!=='string'||!expectedRevision||intent.revision!==expectedRevision||m.revision!==expectedRevision)reasons.push('stale-or-untrusted-revision');
 if(typeof intent.digest!=='string'||!/^[a-f0-9]{64}$/.test(intent.digest)||hash(m)!==intent.digest)reasons.push('manifest-digest-mismatch');
 if(!m.assets||!Array.isArray(m.assets.players)||!Array.isArray(m.assets.contracts)||!Array.isArray(m.assets.picks)||!Array.isArray(m.assets.prospects))reasons.push('malformed-asset-manifest');
 if(!Array.isArray(m.errors)||!Array.isArray(m.blockers)||m.errors.length||m.blockers.length)reasons.push('unresolved-asset-or-settlement-blockers');
 if(options.cancelled===true||options.declined===true)reasons.push('gm-cancelled-or-declined');
 if(options.gmApproved!==true)reasons.push('explicit-gm-approval-required');
 // Even a structurally sound manifest and a caller-provided approval cannot confer trust.
 reasons.push('independent-cpu-verification-unavailable','durable-replay-and-atomic-commit-unavailable');
 return Object.freeze({status:'rejected',reasons:Object.freeze([...new Set(reasons)]),digestValid:!reasons.includes('manifest-digest-mismatch'),revisionMatched:!reasons.includes('stale-or-untrusted-revision'),independentlyAuthenticated:false,replayProtected:false,atomicCommitAvailable:false,settlementAuthorized:false,saved:false});
}
module.exports={validateAssetIntentEnvelope};
