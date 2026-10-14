'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const origin='https://phase11-mobile-conflict.invalid/',root=process.cwd(),moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
async function route(page){await page.route(origin+'**',r=>{const n=decodeURIComponent(new URL(r.request().url()).pathname.slice(1)||'app.html');if(n.includes('..'))return r.abort();const p=path.join(root,n);return fs.existsSync(p)&&fs.statSync(p).isFile()?r.fulfill({status:200,contentType:n.endsWith('.js')?'application/javascript':'text/html',body:fs.readFileSync(p)}):r.fulfill({status:404,body:'Not found'})})}
async function state(page,action,key,value){return page.evaluate(({action,key,value})=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8');q.onsuccess=()=>{const d=q.result,t=d.transaction('state',action==='read'?'readonly':'readwrite'),s=t.objectStore('state');let r;if(action==='read'){r=s.get(key);r.onsuccess=()=>resolve(r.result)}else s.put(value,key);t.oncomplete=()=>{d.close();if(action!=='read')resolve(true)};t.onerror=()=>reject(t.error)};q.onerror=()=>reject(q.error)}),{action,key,value})}
test('mobile two-tab stale cutover rejects newer save and journal without mutation',async({browser})=>{const ctx=await browser.newContext(),a=await ctx.newPage(),b=await ctx.newPage();try{
await route(a);await route(b);await a.goto(origin+'app.html',{waitUntil:'load'});await b.goto(origin+'app.html',{waitUntil:'load'});await a.addScriptTag({content:moduleText});
const original={schema:7,settings:{controlledTeamId:42},customPlayers:[]},candidate={...original,customPlayers:[{id:9001,teamId:42,name:'Imported Player'}]};
await state(b,'write','db',original);
const backup=await a.evaluate(async payload=>{const bytes=new TextEncoder().encode(JSON.stringify(payload));const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({format:'hlm-phase11-verified-production-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},present:true,payload:JSON.stringify(payload),sha256:hash})},original);
const disabled=await a.evaluate(({candidate,backupText})=>HLMPhase11AtomicCutover.createController(indexedDB).commit({candidate,backupText,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}).then(()=>false,()=>true),{candidate,backupText:backup});
expect(disabled).toBe(true);
const pause=await a.evaluate(()=>{const old=crypto.subtle.digest.bind(crypto.subtle);let resume,signal;const gate=new Promise(r=>resume=r),entered=new Promise(r=>signal=r);crypto.subtle.digest=async(...args)=>{signal();await gate;return old(...args)};window.releaseDigest=()=>{crypto.subtle.digest=old;resume()};window.digestEntered=entered;return true});expect(pause).toBe(true);
const pending=a.evaluate(({candidate,backupText})=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}).then(()=>({ok:true}),e=>({ok:false,message:e.message})),{candidate,backupText:backup});
await a.evaluate(()=>window.digestEntered);
const newer={...original,settings:{controlledTeamId:77},customPlayers:[{id:7001,teamId:77,name:'Newer Tab Player'}]};
await state(b,'write','db',newer);await a.evaluate(()=>window.releaseDigest());const result=await pending;
expect(result.ok).toBe(false);expect(result.message).toMatch(/Concurrent save|Backup mismatch|save changed/);
expect(await state(b,'read','db')).toEqual(newer);expect(await state(b,'read','phase11-atomic-cutover-journal-v1')).toBeUndefined();
expect((await a.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status())).cutoverEnabled).toBe(false);
expect(fs.readFileSync('app.html','utf8')).not.toContain('hlm-phase11-atomic-cutover.js');
}finally{await ctx.close()}});
test('interrupted journal cannot rollback or overwrite concurrent mobile save',async({browser})=>{const ctx=await browser.newContext(),a=await ctx.newPage(),b=await ctx.newPage();try{
await route(a);await route(b);await a.goto(origin+'app.html',{waitUntil:'load'});await b.goto(origin+'app.html',{waitUntil:'load'});await a.addScriptTag({content:moduleText});
const newer={schema:7,settings:{controlledTeamId:88},customPlayers:[{id:8001,teamId:88,name:'Keep Me'}]},journal={phase:'interrupted',original:JSON.stringify({schema:7,settings:{controlledTeamId:42},customPlayers:[]}),backupSha256:'a'.repeat(64),candidateSha256:'b'.repeat(64),createdAt:'2026-10-14T18:00:00.000Z'};
await state(b,'write','db',newer);await state(b,'write','phase11-atomic-cutover-journal-v1',journal);
const status=await a.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status());
expect(status).toMatchObject({cutoverEnabled:false,journalPresent:true,recoveryRequired:true,journalRecoveryReady:false,journalMalformed:true});
const denied=await a.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).rollback('I AUTHORIZE PRODUCTION ROLLBACK').then(()=>false,()=>true));
expect(denied).toBe(true);expect(await state(b,'read','db')).toEqual(newer);expect(await state(b,'read','phase11-atomic-cutover-journal-v1')).toEqual(journal);
}finally{await ctx.close()}});
