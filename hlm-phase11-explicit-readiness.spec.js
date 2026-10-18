'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const origin='https://phase11-explicit-readiness.invalid/',root=process.cwd();
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
async function route(page){await page.route(origin+'**',r=>{const n=decodeURIComponent(new URL(r.request().url()).pathname.slice(1)||'app.html');if(n.includes('..'))return r.abort();const p=path.join(root,n);return fs.existsSync(p)&&fs.statSync(p).isFile()?r.fulfill({status:200,contentType:n.endsWith('.js')?'application/javascript':'text/html',body:fs.readFileSync(p)}):r.fulfill({status:404,body:'Not found'})})}
async function state(page,action,key,value){return page.evaluate(({action,key,value})=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onsuccess=()=>{const d=q.result,t=d.transaction('state',action==='read'?'readonly':'readwrite'),s=t.objectStore('state');if(action==='read'){const r=s.get(key);r.onsuccess=()=>resolve(r.result)}else if(action==='delete')s.delete(key);else s.put(value,key);t.oncomplete=()=>{d.close();if(action!=='read')resolve(true)};t.onerror=()=>reject(t.error)};q.onerror=()=>reject(q.error)}),{action,key,value})}
test('isolated mobile Front Office: explicit opt-in, real save path CAS and interrupted journal',async({browser})=>{
 const ctx=await browser.newContext(),a=await ctx.newPage(),b=await ctx.newPage();
 try{
  await route(a);await route(b);
  await a.goto(origin+'app.html',{waitUntil:'load'});await b.goto(origin+'app.html',{waitUntil:'load'});
  expect(await a.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  expect(await a.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('object');
  const original=await state(a,'read','db');
  expect(original).toBeTruthy();
  // Explicitly pin the real application's snapshot, only inside this isolated test context.
  await a.evaluate(snapshot=>{phase11ExpectedState=structuredClone(snapshot);window.HLM_PHASE11_SAVE_GUARD_OPT_IN=true},original);
  await a.evaluate(()=>{db.settings.controlledTeamId=77;save()});
  await a.evaluate(()=>phase11SaveQueue);
  expect((await state(b,'read','db')).settings.controlledTeamId).toBe(77);
  const accepted=await state(b,'read','db');
  expect(await a.evaluate(()=>phase11ExpectedState.settings.controlledTeamId)).toBe(77);
  // Second tab wins before the stale first tab attempts another actual app save.
  await state(b,'write','db',{...accepted,settings:{...accepted.settings,controlledTeamId:88}});
  await a.evaluate(()=>{db.settings.controlledTeamId=99;save()});
  await a.evaluate(()=>phase11SaveQueue);
  expect((await state(b,'read','db')).settings.controlledTeamId).toBe(88);
  expect(await a.evaluate(()=>/Concurrent save or journal change/.test(window.HLM_PHASE11_SAVE_CONFLICT||''))).toBe(true);
  // An interrupted journal also blocks the app's guarded path without overwriting the active save.
  await state(b,'write','phase11-atomic-cutover-journal-v1',{phase:'interrupted'});
  await a.evaluate(()=>{db.settings.controlledTeamId=101;save()});
  await a.evaluate(()=>phase11SaveQueue);
  expect((await state(b,'read','db')).settings.controlledTeamId).toBe(88);
  expect((await state(b,'read','phase11-atomic-cutover-journal-v1')).phase).toBe('interrupted');
  // Rollback is explicitly disabled and must never alter an interrupted save.
  expect(await a.evaluate(async()=>{try{await HLMPhase11AtomicCutover.createController(indexedDB).rollback('I AUTHORIZE PRODUCTION ROLLBACK');return false}catch(e){return /disabled by default/.test(e.message)}})).toBe(true);
  expect((await state(b,'read','db')).settings.controlledTeamId).toBe(88);
 }finally{await ctx.close()}
});
