'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const origin='https://phase11-interruption-1040.invalid/',moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
async function openPage(ctx){const p=await ctx.newPage();await p.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated Phase 11 transaction</title>'}));await p.goto(origin);await p.addScriptTag({content:moduleText});return p}
async function state(p,key){return p.evaluate(key=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readonly'),r=t.objectStore('state').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>reject(r.error)}}),key)}
async function initialize(p,value){await p.evaluate(v=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readwrite');t.objectStore('state').put(v,'db');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)}}),value)}
test('injected second write failure aborts journal and active save atomically; browser restart preserves last commit',async({browser})=>{
 const ctx=await browser.newContext();let p=await openPage(ctx);
 try{
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Recovery 1040'},customPlayers:[]};
  const candidate={...original,customPlayers:[{id:9901040,name:'Synthetic 1040 Prospect',teamId:42,position:'C',ovr:80}]};
  await initialize(p,original);
  expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  const backup=await p.evaluate(async value=>{const payload=JSON.stringify(value);const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));const sha256=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({format:'hlm-phase11-verified-production-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},present:true,payload,sha256})},original);
  const failure=await p.evaluate(async({candidate,backup})=>{
   const put=IDBObjectStore.prototype.put;let triggered=false;
   IDBObjectStore.prototype.put=function(value,key){if(key==='db'&&!triggered){triggered=true;throw Error('Injected interruption after journal queued')}return put.call(this,value,key)};
   try{await HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:backup,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});return {rejected:false,triggered}}
   catch(e){return {rejected:true,triggered,message:String(e)}}
   finally{IDBObjectStore.prototype.put=put}
  },{candidate,backup});
  expect(failure.triggered).toBe(true);expect(failure.rejected).toBe(true);
  expect(await state(p,'db')).toEqual(original);expect(await state(p,'phase11-atomic-cutover-journal-v1')).toBeUndefined();
  await p.close();p=await openPage(ctx);
  expect(await state(p,'db')).toEqual(original);expect(await state(p,'phase11-atomic-cutover-journal-v1')).toBeUndefined();
  const result=await p.evaluate(({candidate,backup})=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:backup,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}),{candidate,backup});
  expect(result.committed).toBe(true);expect(await state(p,'db')).toEqual(candidate);
  const journal=await state(p,'phase11-atomic-cutover-journal-v1');expect(journal.phase).toBe('committed');
  await p.close();p=await openPage(ctx);
  expect(await state(p,'db')).toEqual(candidate);expect(await state(p,'phase11-atomic-cutover-journal-v1')).toEqual(journal);
  const status=await p.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status());
  expect(status).toMatchObject({cutoverEnabled:false,journalPresent:true,journalBackupIntegrity:true,journalActiveIntegrity:true,journalRecoveryReady:true});
  expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: injected second-write failure aborts journal and active state, restart retains last committed save and recovery integrity');
 }finally{await ctx.close()}
});
