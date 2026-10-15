'use strict';
const {test,expect,chromium}=require('@playwright/test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin='https://phase11-overlap-crash-1046.invalid/',moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8'),J='phase11-atomic-cutover-journal-v1';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
function browserPid(profile){const pids=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x));const found=pids.filter(x=>{try{const cmd=fs.readFileSync('/proc/'+x+'/cmdline','utf8').replace(/\0/g,' ');return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&cmd.includes('chrome')}catch{return false}});if(found.length!==1)throw Error('Expected exactly one persistent Chromium browser process; found '+found.join(','));return Number(found[0])}
async function launch(profile){const ctx=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block'});const p=ctx.pages()[0]||await ctx.newPage();await p.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated synthetic crash test</title>'}));await p.goto(origin);await p.addScriptTag({content:moduleText});return {ctx,p}}
async function read(p,key){return p.evaluate(key=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readonly'),r=t.objectStore('state').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>reject(r.error)}}),key)}
async function init(p,value){await p.evaluate(v=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readwrite');t.objectStore('state').put(v,'db');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)}}),value)}
test('overlapping fresh and stale guarded saves survive real Chromium SIGKILL without stale overwrite',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-phase11-1046-'));let session;
 try{
  session=await launch(profile);const a=session.p;
  const b=await session.ctx.newPage();
  await b.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Stale contender</title>'}));
  await b.goto(origin);await b.addScriptTag({content:moduleText});
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Overlap 1046'},customPlayers:[]};
  const winner={...original,settings:{...original.settings,franchiseName:'Previously committed winner'}};
  const fresh={...winner,settings:{...winner.settings,franchiseName:'Fresh overlapping winner'}};
  const stale={...original,settings:{...original.settings,franchiseName:'Stale overwrite forbidden'}};
  const attempt=(p,expected,next)=>p.evaluate(({expected,next})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,expected,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{expected,next});
  await init(a,original);
  expect((await attempt(a,original,winner)).ok).toBe(true);
  expect(await read(a,'db')).toEqual(winner);expect(await read(b,'db')).toEqual(winner);
  expect(await read(a,J)).toBeUndefined();
  const pid=browserPid(profile);
  let signal;const queued=new Promise(resolve=>{signal=resolve});
  a.on('console',msg=>{if(msg.text()==='PHASE11_1046_FRESH_PUT_QUEUED')signal()});
  // Both tabs submit while the same browser is alive. The stale writer uses the
  // obsolete original snapshot; the legitimate writer uses the committed winner.
  // Only the fresh writer can pass the transactional expected-state comparison.
  await Promise.all([
   a.evaluate(({winner,fresh})=>{
    const put=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(value,key){const r=put.call(this,value,key);if(key==='db')console.log('PHASE11_1046_FRESH_PUT_QUEUED');return r};
    HLMPhase11AtomicCutover.guardedSave(indexedDB,winner,fresh).catch(()=>{});
   },{winner,fresh}),
   b.evaluate(({original,stale})=>{
    window.__phase11StaleAttemptStarted=true;
    HLMPhase11AtomicCutover.guardedSave(indexedDB,original,stale).catch(()=>{});
   },{original,stale})
  ]);
  expect(await b.evaluate(()=>window.__phase11StaleAttemptStarted)).toBe(true);
  await Promise.race([queued,new Promise((_,reject)=>setTimeout(()=>reject(Error('Fresh guarded save put not queued')),12000))]);
  process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  const p=session.p,actual=await read(p,'db');
  expect(JSON.stringify(actual)===JSON.stringify(winner)||JSON.stringify(actual)===JSON.stringify(fresh),'Crash must retain committed winner or entire fresh save, never stale contender').toBe(true);
  expect(actual).not.toEqual(stale);
  expect(await read(p,J)).toBeUndefined();
  const rejected=await attempt(p,original,stale);
  expect(rejected.ok).toBe(false);
  expect(rejected.error).toContain('Concurrent save or journal change detected');
  expect(await read(p,'db')).toEqual(actual);
  const continuation={...actual,settings:{...actual.settings,franchiseName:'Post-recovery legitimate continuation'}};
  expect((await attempt(p,actual,continuation)).ok).toBe(true);
  expect(await read(p,'db')).toEqual(continuation);expect(await read(p,J)).toBeUndefined();
  const pid2=browserPid(profile);process.kill(pid2,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  expect(await read(session.p,'db')).toEqual(continuation);
  expect(await read(session.p,J)).toBeUndefined();
  expect(await session.p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: overlapping fresh/stale guardedSave SIGKILL preserves committed or fresh winner, rejects stale, journal absent and continuation persists');
 }finally{if(session)await session.ctx.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});
