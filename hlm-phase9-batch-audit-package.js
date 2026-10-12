'use strict';
// Mission 525: package a verified audit bundle with manifest into portable JSON.
const {createGameBatchAuditManifest,verifyGameBatchAuditManifest}=require('./hlm-phase9-batch-audit-manifest');
function packageGameBatchAudit({storage,receipt}={}){
 const {manifest,bundle}=createGameBatchAuditManifest({storage,receipt});
 const payload={kind:'phase9-game-batch-audit-package',version:1,manifest,
  files:{'audit.json':bundle.json,'audit.csv':bundle.csv,'audit.txt':bundle.text},
  gameCount:bundle.gameCount};
 return Object.freeze({kind:payload.kind,version:1,json:JSON.stringify(payload),
  gameCount:bundle.gameCount,verified:true,persistencePerformed:false});
}
function inspectGameBatchAuditPackage(json){
 let payload;
 try{payload=JSON.parse(json);}catch(_){return Object.freeze({valid:false,errors:Object.freeze(['AUDIT_PACKAGE_INVALID_JSON']),persistencePerformed:false});}
 if(!payload||payload.kind!=='phase9-game-batch-audit-package'||payload.version!==1||
 !payload.files||typeof payload.files['audit.json']!=='string'||
 typeof payload.files['audit.csv']!=='string'||typeof payload.files['audit.txt']!=='string')
 return Object.freeze({valid:false,errors:Object.freeze(['AUDIT_PACKAGE_INVALID']),persistencePerformed:false});
 const bundle={kind:'phase9-game-batch-audit-bundle',verified:true,gameCount:payload.gameCount,
  json:payload.files['audit.json'],csv:payload.files['audit.csv'],text:payload.files['audit.txt']};
 const result=verifyGameBatchAuditManifest({manifest:payload.manifest,bundle});
 return Object.freeze({valid:result.valid,errors:result.errors,
  gameCount:payload.gameCount,persistencePerformed:false});
}
module.exports={packageGameBatchAudit,inspectGameBatchAuditPackage};
