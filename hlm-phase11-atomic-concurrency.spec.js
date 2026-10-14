'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const code=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8'),origin='https://phase11-atomic-concurrency.invalid/';
const original={schema:7,settings:{controlledTeamId:42,season:2026},customPlayers:[],contracts:[{id:12}],draftPickOverrides:{'2027':42},history:[{season:2026}]};
const candidate={...original,customPlayers:[{id:9001,name:'Imported Rookie',teamId:42,position:'C',ovr:79}]};
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(page){await page.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Atomic concurrency</title>'}));await page.goto(origin);await page.addScriptTag({content:code});await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),original)}
async function backup(page){return page.evaluate(async()=>{const state={schema:7,settings:{controlledTeamId:42,season:2026},customPlayers:[],contracts:[{id:12}],draftPickOverrides:{'2027':42},history:[{season:2026}]},payload=JSON.stringify(state),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)))].map(x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({format:'hlm-phase11-verified-production-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},present:true,payload,sha256})})}
async function state(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,q=db.transaction('state','readonly').objectStore('state').get('db');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}))}
test('stale verified backup blocks concurrent save changes without journal',async({page})=>{
 await setup(page);const text=await backup(page);
 await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite'),q=tx.objectStore('state').get('db');q.onsuccess=()=>tx.objectStore('state').put({...q.result,notes:['concurrent edit']},'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}));
 const rejected=await page.evaluate(async({candidate,text})=>{try{await HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:text,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});return false}catch{return true}},{candidate,text});
 expect(rejected).toBe(true);expect((await state(page)).notes).toEqual(['concurrent edit']);
});
test('atomic commit journals original and exact rollback restores every protected field',async({page})=>{
 await setup(page);const text=await backup(page);
 const result=await page.evaluate(({candidate,text})=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:text,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}),{candidate,text});
 expect(result.committed).toBe(true);
 const journal=await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status());expect(journal.journal.phase).toBe('committed');
 expect(await state(page)).toEqual(candidate);
 const rolled=await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).rollback('I AUTHORIZE PRODUCTION ROLLBACK'));
 expect(rolled.exactOriginalRestored).toBe(true);expect(await state(page)).toEqual(original);
 const status=await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status());expect(status.journal).toBeNull();
});
test('post-commit changes block unsafe rollback and preserve user edits',async({page})=>{
 await setup(page);const text=await backup(page);
 await page.evaluate(({candidate,text})=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:text,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}),{candidate,text});
 await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite'),q=tx.objectStore('state').get('db');q.onsuccess=()=>tx.objectStore('state').put({...q.result,notes:['new GM edit']},'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}));
 const rejected=await page.evaluate(async()=>{try{await HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).rollback('I AUTHORIZE PRODUCTION ROLLBACK');return false}catch{return true}});expect(rejected).toBe(true);
 expect((await state(page)).notes).toEqual(['new GM edit']);
});
