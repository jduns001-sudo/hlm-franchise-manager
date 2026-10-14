(function(global){'use strict';
const KEY='hlm-phase11-imported-franchise-v1',DB='hlm_front_office_v8',STORE='state',RECORD='db';
const PROTECTED=['customPlayers','playerOverrides','draftPickOverrides','extraDraftPicks','decisions','transactions','lines','depth','contracts','prospects','draftBoard','history','waivers','notes'];
function imported(storage){
 const raw=storage.getItem(KEY);if(!raw)throw Error('No imported roster staged');
 if(raw.length>5000000)throw Error('Imported roster too large');
 let s;try{s=JSON.parse(raw)}catch{throw Error('Invalid imported JSON')}
 const u=s?.universe;if(!u||!Array.isArray(u.teams)||!Array.isArray(u.players)||u.teams.length<2||u.players.length<12)throw Error('Invalid imported roster');
 const teams=new Set(),players=new Set();
 for(const t of u.teams){if(!Number.isSafeInteger(t.id)||t.id<=0||teams.has(t.id)||typeof t.name!=='string'||!t.name.trim())throw Error('Invalid team');teams.add(t.id)}
 for(const p of u.players){if(!Number.isSafeInteger(p.id)||p.id<=0||players.has(p.id)||!teams.has(p.teamId)||!['C','LW','RW','D','G'].includes(p.position)||!Number.isInteger(p.ovr)||p.ovr<1||p.ovr>99)throw Error('Invalid player');players.add(p.id)}
 if(!teams.has(s?.meta?.controlledTeamId))throw Error('Controlled team missing');
 return {teams:teams.size,players:players.size,controlledTeamId:s.meta.controlledTeamId};
}
function readProduction(idb){return new Promise((resolve,reject)=>{const r=idb.open(DB);r.onupgradeneeded=()=>r.transaction.abort();r.onerror=()=>reject(r.error||Error('Production database unavailable'));r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){db.close();reject(Error('Production store missing'));return}const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).get(RECORD);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(tx.error)}}})}
async function inspect(storage,idb){
 const candidate=imported(storage),current=await readProduction(idb);
 if(!current||typeof current!=='object'||current.schema!==7||!current.settings||typeof current.settings!=='object')throw Error('Unsupported or missing production schema 7 save');
 const currentTeam=current.settings.controlledTeamId??null;
 const counts=Object.fromEntries(PROTECTED.filter(k=>Object.prototype.hasOwnProperty.call(current,k)).map(k=>[k,Array.isArray(current[k])?current[k].length:current[k]&&typeof current[k]==='object'?Object.keys(current[k]).length:1]));
 return {imported:candidate,production:{schema:current.schema,controlledTeamId:currentTeam,protectedCounts:counts},controlledTeamConflict:currentTeam!==null&&currentTeam!==candidate.controlledTeamId,automaticActivationAllowed:false,writes:0};
}
global.HLMPhase11LiveImportPreview={inspect,imported,readProduction};
if(typeof document==='undefined')return;
const btn=document.getElementById('inspect');if(btn)btn.onclick=async()=>{const out=document.getElementById('result');try{out.textContent=JSON.stringify(await inspect(localStorage,indexedDB),null,2)}catch(e){out.textContent='Compatibility check blocked: '+e.message}};
})(window);