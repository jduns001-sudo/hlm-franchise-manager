'use strict';
/* Mission 1542: fail-closed transaction gate. No persistence or candidate state exposure. */
const {previewAtomicTrade}=require('./hlm-phase11-m1541-atomic-trade-preview');
function requestAtomicTradeCommit({readCurrent,writeCurrent,storageKey,state,input}={}){
 const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
 if(typeof storageKey!=='string'||!/^hlm-[a-zA-Z0-9_-]+$/.test(storageKey)||
    storageKey==='hlm_front_office_v8')return deny('isolated-storage-required');
 if(typeof readCurrent!=='function')return deny('source-reader-required');
 // Deliberately do not call writeCurrent, even if supplied.
 const snapshot=readCurrent();
 if(!snapshot||!Number.isSafeInteger(snapshot.meta?.revision))return deny('persisted-source-required');
 if(!state||snapshot.meta.revision!==state.meta?.revision)return deny('stale-persisted-source');
 const preview=previewAtomicTrade(snapshot,input);
 if(preview.ok!==true)return deny(preview.code);
 // CPU policy recommendations and caller-supplied flags are not authenticated consent.
 return Object.freeze({ok:false,code:'receiving-team-consent-not-authenticated',
  expectedRevision:preview.expectedRevision,saved:false,settlementAuthorized:false});
}
module.exports={requestAtomicTradeCommit};
