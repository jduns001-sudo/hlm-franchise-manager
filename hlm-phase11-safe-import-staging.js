(function(global){'use strict';
/* Opt-in isolated staging. Never opens hlm_front_office_v8 or changes live saves. */
const NAME='hlm_phase11_safe_import_staging_v1',STORE='records';
function txPromise(tx){return new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Transaction aborted'));tx.onerror=()=>reject(tx.error||Error('Transaction failed'))})}
function open(idb){return new Promise((resolve,reject)=>{const r=idb.open(NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function get(db,key){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
function fingerprint(v){const s=JSON.stringify(v);if(!s||s.length>5000000)throw Error('Invalid oversized payload');return s}
function validate(plan,save,receipt,authorization){
 if(authorization!=='I AUTHORIZE ISOLATED STAGING')throw Error('Explicit GM authorization required');
 if(!receipt||receipt.verified!==true||!/^[a-f0-9]{64}$/.test(receipt.sha256||''))throw Error('Independently verified backup required');
 if(!save||save.schema!==7||!save.settings||!Array.isArray(save.customPlayers))throw Error('Unsupported production schema');
 if(!plan||plan.automaticCutoverAllowed!==false||!Array.isArray(plan.candidateCustomPlayers)||plan.requiresTeamIdMapping!==false)throw Error('Fully mapped, non-activating candidate required');
 const ids=new Set(save.customPlayers.map(p=>String(p.id)));
 for(const p of plan.candidateCustomPlayers){if(!p||ids.has(String(p.id))||p.teamId===undefined||!Number.isSafeInteger(p.id))throw Error('Player ID collision or missing team');ids.add(String(p.id))}
 return {schema:7,...save,customPlayers:[...save.customPlayers,...plan.candidateCustomPlayers]};
}
async function stage(idb,plan,save,receipt,authorization){
 const candidate=validate(plan,save,receipt,authorization),original=fingerprint(save),next=fingerprint(candidate);
 const db=await open(idb);
 try{
  if(await get(db,'journal'))throw Error('Unresolved import staging journal; rollback first');
  const journal={phase:'staged',backupSha256:receipt.sha256,original,next,createdAt:new Date().toISOString()};
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  store.put(journal,'journal');store.put(candidate,'candidate');await txPromise(tx);
  return {phase:'staged',candidateCount:plan.candidateCustomPlayers.length,productionWrites:0,activationAllowed:false};
 }finally{db.close()}
}
async function inspect(idb){const db=await open(idb);try{return {journal:await get(db,'journal')||null,candidate:await get(db,'candidate')||null}}finally{db.close()}}
async function rollback(idb,authorization){if(authorization!=='I AUTHORIZE STAGING ROLLBACK')throw Error('Explicit GM rollback authorization required');const db=await open(idb);try{const tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);s.delete('journal');s.delete('candidate');await txPromise(tx);if(await get(db,'journal')||await get(db,'candidate'))throw Error('Staging rollback verification failed');return {rolledBack:true,productionWrites:0}}finally{db.close()}}
global.HLMPhase11SafeImportStaging={stage,inspect,rollback,validate,database:NAME};
})(window);