/* Experimental cross-tab coordinator: Web Locks serializes cooperating same-origin tabs. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedTabGuard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';const LOCK='hlm-phase11-experimental-journal-v1-exclusive';
function create(store,locks){if(!store||store.isolated!==true||typeof store.loadRevision!=='function'||typeof store.saveIfRevision!=='function')throw Error('Isolated store required');
async function saveApproved(approved,nextState,expectedRevision){if(approved!==true)throw Error('Human GM approval required');if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('Invalid revision');if(!locks||typeof locks.request!=='function')throw Error('Cross-tab coordination unavailable: refusing unsafe write');
return locks.request(LOCK,{mode:'exclusive'},async()=>{if(store.loadRevision()!==expectedRevision)throw Error('Stale isolated revision');if(store.saveIfRevision(nextState,expectedRevision)!==true)throw Error('Isolated revision conflict');return Object.freeze({revision:expectedRevision+1,productionWrite:false,finalDecisionMaker:'human-gm',crossTabCoordinated:true})});}
return Object.freeze({saveApproved,requiresHumanApproval:true,productionWrite:false});}
return Object.freeze({create,LOCK});
});
