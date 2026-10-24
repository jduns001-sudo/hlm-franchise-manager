'use strict';
/* Mission 1526: read-only browser bridge to experimental persisted review.
 * No settlement, no production state access. Browser bundling is deliberately
 * explicit: the host factory must be supplied by an isolated test harness.
 */
(function(root){
 function connect(factory,options={}){
  if(options.experimentalEnabled!==true||typeof factory!=='function')
   return Object.freeze({connected:false,code:'experiment-disabled-or-host-unavailable'});
  if(typeof options.experimentalDatabaseName!=='string'||
     !/^hlm-[a-zA-Z0-9_-]+$/.test(options.experimentalDatabaseName))
   return Object.freeze({connected:false,code:'isolated-database-required'});
  const source=factory({experimentalEnabled:true,experimentalDatabaseName:options.experimentalDatabaseName});
  if(!source||typeof source.review!=='function')return Object.freeze({connected:false,code:'review-host-unavailable'});
  root.HLMTradeReviewHost=Object.freeze({
   review:request=>source.review(request),
   settle:async()=>Object.freeze({ok:false,code:'settlement-not-connected',saved:false,settlementAuthorized:false})
  });
  return Object.freeze({connected:true,code:'experimental-read-only-host-connected'});
 }
 root.HLMTradeReviewBridge=Object.freeze({connect});
})(typeof window!=='undefined'?window:globalThis);
