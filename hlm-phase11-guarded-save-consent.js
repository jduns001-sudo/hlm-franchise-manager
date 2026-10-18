/* Human GM controlled, disabled-by-default opt-in for existing guarded save path. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMPhase11GuardedSaveConsent=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const APPROVAL='I ENABLE GUARDED SAVES';
function create({readPersisted,readExpected,setEnabled,isAvailable}){if(![readPersisted,readExpected,setEnabled,isAvailable].every(f=>typeof f==='function'))throw Error('Guard dependencies required');let enabled=false;let busy=false;
async function activate(phrase){if(busy)throw Error('Guard activation already in progress');if(phrase!==APPROVAL)throw Error('Explicit human GM approval required');if(enabled)return {enabled:true,unchanged:true};busy=true;try{if(!isAvailable())throw Error('Guarded atomic save API unavailable');const expected=readExpected();if(!expected||expected.schema!==7)throw Error('Existing schema 7 save required');const actual=await readPersisted();if(!actual||JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Saved franchise changed; reload before enabling');setEnabled(true);enabled=true;return {enabled:true,unchanged:true}}finally{busy=false}}
function cancel(){setEnabled(false);enabled=false;return {enabled:false,unchanged:true}}
function status(){return Object.freeze({enabled,busy,requiresHumanApproval:true,productionWrite:false})}
return Object.freeze({activate,cancel,status,approvalPhrase:APPROVAL});
}
return Object.freeze({create});
});
