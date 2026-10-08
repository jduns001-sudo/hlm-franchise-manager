(function(root){
'use strict';
// 426: explicit user-initiated legacy snapshot read;
// 427: strict JSON validation; 428: privacy-safe top-level keys;
// 429: data-size warnings; 430: no writes or automatic cutover.
function inspectLegacySnapshot(storage){
 if(!storage||typeof storage.getItem!=='function')throw new TypeError('Storage reader required');
 const raw=storage.getItem('hlm_tracker_v3');
 if(raw==null)return Object.freeze({kind:'cpu-legacy-preview',found:false,keys:Object.freeze([]),bytes:0,warning:'No local Front Office snapshot found',readOnly:true});
 if(raw.length>5000000)throw new Error('Legacy snapshot exceeds preview limit');
 let data;try{data=JSON.parse(raw);}catch(_){throw new Error('Legacy snapshot is not valid JSON');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Legacy snapshot must be an object');
 return Object.freeze({kind:'cpu-legacy-preview',found:true,keys:Object.freeze(Object.keys(data).slice(0,50)),bytes:raw.length,
 warning:'Legacy snapshot only; not a validated GameState and not a CPU decision feed',readOnly:true});
}
if(typeof module!=='undefined'&&module.exports)module.exports={inspectLegacySnapshot};
root.HFMCPULegacyPreview=Object.freeze({inspectLegacySnapshot});
})(typeof globalThis!=='undefined'?globalThis:this);
