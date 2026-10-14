'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const js=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8');
const origin='https://phase11-atomic-cutover.invalid/';
test.use({browserName:'chromium',viewport:{width:390,height:844}});
const original={schema:7,settings:{controlledTeamId:42},customPlayers:[{id:800,name:'Existing',teamId:42}],contracts:[{playerId:7}],draftPickOverrides:{x:1},history:[{season:2026}],lines:{a:[7]}};
const candidate={...original,customPlayers:[...original.customPlayers,{id:9001,name:'New',teamId:42,position:'C',ovr:78}]};
async function setup(page){await page.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Cutover acceptance</title>'}));await page.goto(origin);await page.addScriptTag({content:js});await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),original)}
async function backup(page){return page.evaluate(async()=>{const state=await new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,q=db.transaction('state','readonly').objectStore('state').get('db');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)});const payload=JSON.stringify(state),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)))].map(x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({format:'hlm-phase11-verified-production-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},present:true,payload,sha256:hash})})}
test('default production cutover disabled; test-only opt-in commits atomically, reloads and exactly rolls back',async({page})=>{
 await setup(page);const text=await backup(page);
 const blocked=await page.evaluate(({candidate,text})=>HLMPhase11AtomicCutover.createController(indexedDB).commit({candidate,backupText:text,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}).then(()=>false,()=>true),{candidate,text});expect(blocked).toBe(true);
 const result=await page.evaluate(({candidate,text})=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:text,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}),{candidate,text});expect(result.committed).toBe(true);
 await page.reload();await page.addScriptTag({content:js});
 const journal=await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).status());expect(journal.journal.phase).toBe('committed');
 const restored=await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).rollback('I AUTHORIZE PRODUCTION ROLLBACK'));expect(restored.exactOriginalRestored).toBe(true);
 const active=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,q=db.transaction('state','readonly').objectStore('state').get('db');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}));expect(active).toEqual(original);
});
test('tampered backup or protected history modification rejects cutover',async({page})=>{
 await setup(page);const text=await backup(page);
 for(const [next,b] of [[candidate,text.slice(0,-3)+'xxx'],[{...candidate,history:[]},text]]){
  const blocked=await page.evaluate(({next,b})=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate:next,backupText:b,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}).then(()=>false,()=>true),{next,b});expect(blocked).toBe(true)
 }
});
