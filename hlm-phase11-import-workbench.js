(function(g){'use strict';
const PROD='hlm_front_office_v8',STORE='state',STAGED='hlm_phase11_workbench_staging_v1',SOURCE='hlm-phase11-imported-franchise-v1',encode=new TextEncoder();
const $=id=>document.getElementById(id);
let context=null,backup=null,receipt=null;
const clone=x=>JSON.parse(JSON.stringify(x));
async function hash(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function open(name,version){return new Promise((resolve,reject)=>{const r=version?indexedDB.open(name,version):indexedDB.open(name);r.onupgradeneeded=()=>{if(name===PROD){r.transaction.abort();return}r.result.createObjectStore('records')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function read(db,store,key){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),q=tx.objectStore(store).get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
async function current(){const db=await open(PROD);try{if(!db.objectStoreNames.contains(STORE))throw Error('Production state store missing');const state=await read(db,STORE,'db');if(!state||state.schema!==7||!Array.isArray(state.customPlayers)||!state.settings)throw Error('Production schema 7 save required');return state}finally{db.close()}}
async function inspect(){
 const r=await fetch('./hlm-universe.json',{cache:'no-store'});if(!r.ok)throw Error('Universe unavailable');const u=await r.json();
 const raw=localStorage.getItem(SOURCE);if(!raw||raw.length>5000000)throw Error('No staged roster found');const imported=JSON.parse(raw)?.universe;
 if(!Array.isArray(u.teams)||!Array.isArray(u.players)||!Array.isArray(imported?.teams)||!Array.isArray(imported?.players))throw Error('Invalid universes');
 const state=await current(),ids=new Set([...u.players,...state.customPlayers].map(p=>String(p.id)));
 const teams=new Set(),playerIds=new Set();
 for(const t of imported.teams){if(!Number.isSafeInteger(t.id)||t.id<=0||teams.has(t.id)||!t.name)throw Error('Invalid imported teams');teams.add(t.id)}
 for(const p of imported.players){if(!Number.isSafeInteger(p.id)||p.id<=0||playerIds.has(p.id)||!teams.has(p.teamId)||!['C','LW','RW','D','G'].includes(p.position)||!Number.isInteger(p.ovr)||p.ovr<1||p.ovr>99)throw Error('Invalid imported players');playerIds.add(p.id)}
 const collisions=imported.players.filter(p=>ids.has(String(p.id)));if(collisions.length)throw Error(collisions.length+' player ID collisions. Import blocked; no IDs silently rewritten.');
 const targets=new Set(u.teams.map(t=>String(t.id)));if(targets.size!==u.teams.length)throw Error('Duplicate production teams');
 context={u,imported,state,targets};
 return {teams:imported.teams,targets:u.teams.map(t=>({id:t.id,name:t.name||t.abbr||String(t.id)})),players:imported.players.length,protectedFields:['contracts','draftPickOverrides','history','lines','depth'],controlledTeamId:state.settings.controlledTeamId};
}
function assignments(){
 if(!context)throw Error('Inspect first');
 const seen=new Set(),map={};for(const t of context.imported.teams){const value=$('map-'+t.id)?.value;if(!value||!context.targets.has(value)||seen.has(value))throw Error('Each team needs a unique explicit production team assignment');seen.add(value);map[t.id]=context.u.teams.find(x=>String(x.id)===value).id}return map;
}
function candidate(){
 const map=assignments(),state=clone(context.state),ids=new Set(state.customPlayers.map(p=>String(p.id)));
 const players=context.imported.players.map(p=>{if(ids.has(String(p.id)))throw Error('Duplicate player');ids.add(String(p.id));return {id:p.id,name:p.name,teamId:map[p.teamId],team:map[p.teamId],position:p.position,positions:[p.position],ovr:p.ovr,overall:p.ovr}});
 state.customPlayers=[...state.customPlayers,...players];return {state,players:players.length};
}
async function capture(){
 const state=await current(),payload=JSON.stringify(state);if(payload.length>5000000)throw Error('Save too large');const sha256=await hash(payload),doc={format:'hlm-phase11-workbench-backup-v1',source:{database:PROD,store:STORE,key:'db'},payload,sha256};
 const text=JSON.stringify(doc),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hlm-phase11-workbench-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);backup=doc;receipt=null;return sha256;
}
async function verify(text){if(!backup||text.length>6000000)throw Error('Capture backup first');const doc=JSON.parse(text);if(doc.format!==backup.format||doc.source?.database!==PROD||doc.source?.store!==STORE||doc.source?.key!=='db'||doc.sha256!==backup.sha256||await hash(doc.payload)!==doc.sha256||doc.payload!==backup.payload)throw Error('Reopened backup mismatch');if(JSON.stringify(await current())!==doc.payload)throw Error('Active save changed since backup');receipt={verified:true,sha256:doc.sha256};return receipt}
async function stage(authorization){
 if(authorization!=='I AUTHORIZE ISOLATED STAGING'||!receipt?.verified)throw Error('Verified reopened backup and explicit GM authorization required');
 const {state,players}=candidate(),live=await current();if(JSON.stringify(live)!==backup.payload)throw Error('Production save changed; recapture backup');
 const db=await open(STAGED,1);
 try{
  if(await read(db,'records','journal'))throw Error('Existing journal must be discarded first');
  const journal={phase:'staged',backupSha256:receipt.sha256,original:backup.payload,candidateHash:await hash(JSON.stringify(state))};
  await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),s=tx.objectStore('records');s.put(journal,'journal');s.put(state,'candidate');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Aborted'))});
  return {stagedPlayers:players,productionWrites:0,activationEnabled:false};
 }finally{db.close()}
}
async function rollback(authorization){
 if(authorization!=='I AUTHORIZE STAGING ROLLBACK')throw Error('Explicit rollback authorization required');
 const db=await open(STAGED,1);try{await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),s=tx.objectStore('records');s.delete('journal');s.delete('candidate');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});if(await read(db,'records','journal')||await read(db,'records','candidate'))throw Error('Rollback verification failed');return {rolledBack:true,productionWrites:0}}finally{db.close()}
}
g.HLMPhase11ImportWorkbench={inspect,assignments,candidate,capture,verify,stage,rollback,current};
if(!$('load'))return;
const status=(x)=>{$('status').textContent=typeof x==='string'?x:JSON.stringify(x,null,2)};
$('load').onclick=async()=>{try{const result=await inspect(),container=$('mappings');container.replaceChildren();for(const team of result.teams){const label=document.createElement('label');label.textContent=team.name+' → ';const sel=document.createElement('select');sel.id='map-'+team.id;const empty=document.createElement('option');empty.value='';empty.textContent='Choose Front Office team';sel.append(empty);for(const t of result.targets){const option=document.createElement('option');option.value=String(t.id);option.textContent=t.name+' ('+t.id+')';sel.append(option)}label.append(sel);container.append(label)}status({message:'Choose unique mappings, then download and reopen backup',...result})}catch(e){status('Blocked: '+e.message)}};
$('backup').onclick=async()=>{try{status('Downloaded backup '+await capture()+'. Reopen the file to verify.')}catch(e){status('Blocked: '+e.message)}};
$('reopen').onchange=async e=>{try{status({backupVerified:await verify(await e.target.files[0].text())})}catch(err){status('Blocked: '+err.message)}};
$('stage').onclick=async()=>{try{status(await stage($('authorization').value))}catch(e){status('Blocked: '+e.message)}};
$('rollback').onclick=async()=>{try{status(await rollback('I AUTHORIZE STAGING ROLLBACK'))}catch(e){status('Blocked: '+e.message)}};
})(window);