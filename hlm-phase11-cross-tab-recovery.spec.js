'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const source=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8');
const origin='https://phase11-cross-tab.invalid/';
const original={schema:7,settings:{controlledTeamId:42},customPlayers:[],contracts:[{id:1}],draftPickOverrides:{'2027':42},history:[{season:2026}]};
const candidate={...original,customPlayers:[{id:9001,name:'New Rookie',teamId:42,position:'C',ovr:80}]};
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(browser){
 const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();
 await context.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Cross tab</title>'}));
 await a.goto(origin);await b.goto(origin);await a.addScriptTag({content:source});await b.addScriptTag({content:source});
 await a.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),original);
 const backup=await a.evaluate(async()=>{const payload=JSON.stringify({schema:7,settings:{controlledTeamId:42},customPlayers:[],contracts:[{id:1}],draftPickOverrides:{'2027':42},history:[{season:2026}]}),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)))].map(x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({format:'hlm-phase11-verified-production-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},present:true,payload,sha256})});
 return {context,a,b,backup};
}
async function state(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,q=db.transaction('state','readonly').objectStore('state').get('db');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}))}
test('two tabs racing to commit from one backup permit only one atomic write',async({browser})=>{
 const {context,a,b,backup}=await setup(browser);try{
  const attempt=page=>page.evaluate(async({candidate,backup})=>{try{return await HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:backup,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'})}catch(e){return {blocked:e.message}}},{candidate,backup});
  const results=await Promise.all([attempt(a),attempt(b)]);
  expect(results.filter(r=>r.committed)).toHaveLength(1);expect(results.filter(r=>r.blocked)).toHaveLength(1);
  expect(await state(a)).toEqual(candidate);
  const status=await b.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status());expect(status.journal.phase).toBe('committed');
 }finally{await context.close()}
});
test('reopened tab detects durable journal and refuses duplicate commit until authorized rollback',async({browser})=>{
 const {context,a,b,backup}=await setup(browser);try{
  await a.evaluate(({candidate,backup})=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:backup,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}),{candidate,backup});
  await b.reload();await b.addScriptTag({content:source});
  const status=await b.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status());expect(status.journal.phase).toBe('committed');
  const rejected=await b.evaluate(async({candidate,backup})=>{try{await HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:backup,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});return false}catch{return true}},{candidate,backup});expect(rejected).toBe(true);
  const rolled=await b.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).rollback('I AUTHORIZE PRODUCTION ROLLBACK'));
  expect(rolled.exactOriginalRestored).toBe(true);expect(await state(a)).toEqual(original);
 }finally{await context.close()}
});
