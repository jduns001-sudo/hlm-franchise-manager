/* Experimental isolated two-slot journal. LocalStorage is NOT atomic cross-tab CAS. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMIsolatedJournal=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PREFIX='hlm-phase11-experimental-journal-v1',KEYS=[PREFIX+'-a',PREFIX+'-b'];
function digest(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(16).padStart(8,'0')}
function create(storage){if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('Storage required');
function read(){const valid=[];for(const key of KEYS){try{const raw=storage.getItem(key);if(!raw)continue;const p=JSON.parse(raw);if(p&&p.kind===PREFIX&&Number.isSafeInteger(p.revision)&&p.revision>=1&&typeof p.payload==='string'&&digest(p.payload)===p.checksum){const state=JSON.parse(p.payload);if(state&&typeof state==='object'&&!Array.isArray(state))valid.push({key,revision:p.revision,state})}}catch(_){/* Corrupt or interrupted slot ignored. */}}
valid.sort((a,b)=>b.revision-a.revision);return valid[0]||{key:null,revision:0,state:null}}
function saveIfRevision(state,expected){if(!Number.isSafeInteger(expected)||expected<0||read().revision!==expected)return false;const payload=JSON.stringify(state);if(typeof payload!=='string'||payload.length>20000000)throw Error('Invalid isolated state size');const current=read();const target=KEYS.find(k=>k!==current.key)||KEYS[0];const packet=JSON.stringify({kind:PREFIX,revision:expected+1,payload,checksum:digest(payload)});storage.setItem(target,packet);const latest=read();if(latest.revision!==expected+1||latest.key!==target||digest(JSON.stringify(latest.state))!==digest(payload))throw Error('Isolated write verification failed');return true}
return Object.freeze({isolated:true,load:()=>read().state,loadRevision:()=>read().revision,saveIfRevision,storageKeys:Object.freeze([...KEYS]),crossTabAtomic:false,productionWrite:false});}
return Object.freeze({create,PREFIX});
});
