/* M1576: independently pinned contract evidence provenance, read-only.
 * Never trust a publisher, digest, or signature asserted by the uploaded file.
 * No production trust anchors are configured. No settlement or save API.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMContractProvenanceReadiness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const hex=/^[a-f0-9]{64}$/i;
const deny=(code,detail='')=>Object.freeze({ok:false,code,detail,saved:false,contractImportAuthorized:false,settlementAuthorized:false,cpuConsentAuthenticated:false});
function check({document,digest,anchor,inspection,expectedSeasonRevision}={}){
 if(!document||typeof document!=='object'||Array.isArray(document)||!inspection||inspection.identityMatched!==true||
  inspection.saved!==false||inspection.contractsImported!==false)return deny('validated-source-review-required');
 if(typeof digest!=='string'||!hex.test(digest))return deny('verified-file-digest-required');
 // The registry entry is supplied by the trusted application boundary, not the document.
 if(!anchor||typeof anchor!=='object'||Array.isArray(anchor)||anchor.trustedByHost!==true||
  typeof anchor.sha256!=='string'||!hex.test(anchor.sha256)||
  typeof anchor.publisher!=='string'||!anchor.publisher.trim()||
  typeof anchor.reference!=='string'||!anchor.reference.trim()||
  typeof anchor.asOfDate!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(anchor.asOfDate))
  return deny('trusted-host-source-anchor-unavailable');
 if(anchor.sha256.toLowerCase()!==digest.toLowerCase())return deny('source-fingerprint-mismatch');
 if(document.source?.publisher!==anchor.publisher||document.source?.reference!==anchor.reference||
  document.source?.asOfDate!==anchor.asOfDate)return deny('source-metadata-mismatch');
 if(!Number.isSafeInteger(expectedSeasonRevision)||expectedSeasonRevision<0||
  inspection.seasonRevision!==expectedSeasonRevision)return deny('season-revision-not-verified');
 if(inspection.evidenceCompleteForDeclaredScope!==true)return deny('source-coverage-incomplete');
 // Independent fingerprint matching establishes only registry membership, not
 // contractual truth, league permissions, or the consent of another GM.
 return Object.freeze({ok:true,code:'host-pinned-source-match-readonly',saved:false,
  sourcePublisherAuthenticated:false,hostPinMatched:true,contractImportAuthorized:false,
  settlementAuthorized:false,cpuConsentAuthenticated:false,realSeasonIntegrationReady:false,
  message:'Host-pinned digest matched; external contract authority, GM approval, CPU consent and real-season import are still unavailable.'});
}
function create(readState,hostAnchors=Object.freeze([])){
 if(typeof readState!=='function')throw Error('Saved season reader required');
 // No uploaded document may write to this registry.
 const pins=Array.isArray(hostAnchors)?hostAnchors.map(x=>Object.freeze({...x})):[];
 const anchorFor=digest=>pins.find(x=>x.trustedByHost===true&&typeof x.sha256==='string'&&
  x.sha256.toLowerCase()===String(digest).toLowerCase());
 let baseline=null;
 return Object.freeze({
  begin(){const s=readState();if(!s)throw Error('Saved isolated season required');baseline=JSON.stringify(s);
   return Object.freeze({saved:false,availablePins:pins.filter(p=>p.trustedByHost===true).length})},
  cancel(){baseline=null;return deny('review-cancelled')},
  review(document,digest,inspection){
   if(baseline===null)return deny('review-required');
   const s=readState();
   if(!s||JSON.stringify(s)!==baseline){baseline=null;return deny('stale-saved-season')}
   const enriched={...inspection,seasonRevision:s.meta?.revision??0};
   const result=check({document,digest,anchor:anchorFor(digest),inspection:enriched,
    expectedSeasonRevision:s.meta?.revision??0});
   if(JSON.stringify(readState())!==baseline){baseline=null;return deny('stale-saved-season')}
   return result;
  }
 });
}
return Object.freeze({check,create});
});
