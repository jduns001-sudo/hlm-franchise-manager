/* Isolated, revision-checked browser store. Separate key from production saves. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedRecoveryStore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='hlm-phase11-isolated-recovery-transaction-v1';
function createStore(storage){if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('Storage required');
function read(){const raw=storage.getItem(KEY);if(!raw)return {revision:0,state:null};let value;try{value=JSON.parse(raw)}catch(e){throw Error('Interrupted or corrupt isolated checkpoint')};if(!value||!Number.isSafeInteger(value.revision)||value.revision<1||!value.state)throw Error('Invalid isolated checkpoint');return value}
return Object.freeze({isolated:true,loadRevision(){return read().revision},load(){return read().state},saveIfRevision(state,expected){if(!Number.isSafeInteger(expected)||expected<0||read().revision!==expected)return false;const next=JSON.stringify({revision:expected+1,state});storage.setItem(KEY,next);return read().revision===expected+1},key:KEY});
}
return Object.freeze({createStore});
});
