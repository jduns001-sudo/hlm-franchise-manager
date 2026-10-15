'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const origin='https://phase11-concurrent-valid.invalid/',root=process.cwd(),moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
async function route(p){await p.route(origin+'**',r=>{const n=decodeURIComponent(new URL(r.request().url()).pathname.slice(1)||'app.html');if(n.includes('..'))return r.abort();const f=path.join(root,n);return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({status:200,contentType:n.endsWith('.js')?'application/javascript':'text/html',body:fs.readFileSync(f)}):r.fulfill({status:404,body:'missing'})})}
async function dbOp(p,op,key,value){return p.evaluate(({op,key,value})=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state',op==='read'?'readonly':'readwrite'),s=t.objectStore('state');let result;const req=op==='read'?s.get(key):s.put(value,key);req.onsuccess=()=>{result=req.result};t.oncomplete=()=>{d.close();resolve(result)};t.onerror=()=>reject(t.error)}}),{op,key,value})}
test('two legitimate simultaneous writes serialize, stale edit rejects, interrupted journal blocks writes',async({browser})=>{
 const ctx=await browser.newContext(),a=await ctx.newPage(),b=await ctx.newPage();
 try{
  for(const p of [a,b]){await route(p);await p.goto(origin+'app.html',{waitUntil:'load'});await expect(p.locator('#nav button').first()).toBeVisible();expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);expect(await p.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('undefined');await p.addScriptTag({content:moduleText})}
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Concurrency 1039'},customPlayers:[]};
  await dbOp(a,'write','db',original);
  const one={...original,settings:{...original.settings,franchiseName:'Synthetic Winner A'}};
  const two={...original,settings:{...original.settings,franchiseName:'Synthetic Winner B'}};
  const pending=[a.evaluate(({old,next})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,old,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{old:original,next:one}),b.evaluate(({old,next})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,old,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{old:original,next:two})];
  const outcomes=await Promise.all(pending);
  expect(outcomes.filter(x=>x.ok)).toHaveLength(1);expect(outcomes.filter(x=>!x.ok)).toHaveLength(1);
  const winner=outcomes[0].ok?one:two;
  expect(await dbOp(a,'read','db')).toEqual(winner);expect(await dbOp(b,'read','db')).toEqual(winner);
  const loser=outcomes[0].ok?b:a;
  const stale=await loser.evaluate(({old,next})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,old,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{old:original,next:outcomes[0].ok?two:one});
  expect(stale.ok).toBe(false);expect(await dbOp(a,'read','db')).toEqual(winner);
  const journal={phase:'interrupted',marker:'synthetic-only'};
  await dbOp(b,'write','phase11-atomic-cutover-journal-v1',journal);
  const interrupted=await a.evaluate(({old,next})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,old,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{old:winner,next:original});
  expect(interrupted.ok).toBe(false);expect(await dbOp(a,'read','db')).toEqual(winner);expect(await dbOp(b,'read','phase11-atomic-cutover-journal-v1')).toEqual(journal);
  await Promise.all([a.reload({waitUntil:'load'}),b.reload({waitUntil:'load'})]);
  expect(await dbOp(a,'read','db')).toEqual(winner);expect(await dbOp(b,'read','db')).toEqual(winner);expect(await dbOp(a,'read','phase11-atomic-cutover-journal-v1')).toEqual(journal);
  for(const p of [a,b])expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: exactly one legitimate concurrent write, stale rejection, interrupted journal preserves committed state after reload');
 }finally{await ctx.close()}
});
