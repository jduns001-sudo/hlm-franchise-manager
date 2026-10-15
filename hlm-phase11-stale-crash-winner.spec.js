'use strict';
const {test,expect,chromium}=require('@playwright/test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin='https://phase11-stale-crash-1045.invalid/',moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8'),J='phase11-atomic-cutover-journal-v1';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
function browserPid(profile){const pids=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x));const found=pids.filter(x=>{try{const cmd=fs.readFileSync('/proc/'+x+'/cmdline','utf8').replace(/\0/g,' ');return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&cmd.includes('chrome')}catch{return false}});if(found.length!==1)throw Error('Expected exactly one persistent Chromium browser process; found '+found.join(','));return Number(found[0])}
async function launch(profile){const ctx=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block'});const p=ctx.pages()[0]||await ctx.newPage();await p.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated synthetic crash test</title>'}));await p.goto(origin);await p.addScriptTag({content:moduleText});return {ctx,p}}
async function read(p,key){return p.evaluate(key=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readonly'),r=t.objectStore('state').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>reject(r.error)}}),key)}
async function init(p,value){await p.evaluate(v=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readwrite');t.objectStore('state').put(v,'db');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)}}),value)}
test('SIGKILL at stale guardedSave rejection preserves competing winner and permits refreshed save',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-phase11-1045-'));let session;
 try{
  session=await launch(profile);const p=session.p;
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Stale 1045'},customPlayers:[]};
  const winner={...original,settings:{...original.settings,franchiseName:'Committed competing winner'}};
  const staleCandidate={...original,settings:{...original.settings,franchiseName:'Rejected stale candidate'}};
  await init(p,original);
  const rival=await session.ctx.newPage();
  await rival.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Competing synthetic tab</title>'}));
  await rival.goto(origin);await rival.addScriptTag({content:moduleText});
  const attempt=(page,expected,next)=>page.evaluate(({expected,next})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,expected,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{expected,next});
  expect(await read(p,'db')).toEqual(original);
  expect((await attempt(rival,original,winner)).ok).toBe(true);
  expect(await read(p,'db')).toEqual(winner);expect(await read(rival,'db')).toEqual(winner);
  expect(await read(p,J)).toBeUndefined();
  expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  const pid=browserPid(profile);let signal;const reached=new Promise(resolve=>{signal=resolve});
  p.on('console',msg=>{if(msg.text()==='PHASE11_1045_STALE_ABORT')signal()});
  // The stale attempt reaches guardedAtomic's transaction-abort branch.
  // Signal immediately after the real IndexedDB abort is queued, then SIGKILL the browser.
  await p.evaluate(({original,staleCandidate})=>{
   const abort=IDBTransaction.prototype.abort;
   IDBTransaction.prototype.abort=function(){const result=abort.call(this);console.log('PHASE11_1045_STALE_ABORT');return result};
   HLMPhase11AtomicCutover.guardedSave(indexedDB,original,staleCandidate).catch(()=>{});
  },{original,staleCandidate});
  await Promise.race([reached,new Promise((_,reject)=>setTimeout(()=>reject(Error('Stale guardedSave did not abort')),12000))]);
  process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  const restarted=session.p;
  expect(await read(restarted,'db')).toEqual(winner);
  expect(await read(restarted,J)).toBeUndefined();
  const stale=await attempt(restarted,original,staleCandidate);
  expect(stale.ok).toBe(false);expect(stale.error).toContain('Concurrent save or journal change detected');
  expect(await read(restarted,'db')).toEqual(winner);expect(await read(restarted,J)).toBeUndefined();
  const refreshed={...winner,settings:{...winner.settings,franchiseName:'Legitimate refreshed save'}};
  const accepted=await attempt(restarted,winner,refreshed);
  expect(accepted.ok).toBe(true);expect(await read(restarted,'db')).toEqual(refreshed);
  expect(await read(restarted,J)).toBeUndefined();
  const secondPid=browserPid(profile);process.kill(secondPid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  expect(await read(session.p,'db')).toEqual(refreshed);expect(await read(session.p,J)).toBeUndefined();
  expect(await session.p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: competing winner committed, stale guardedSave abort SIGKILL, persistent restart retains winner and journal, stale rejected, refreshed save survives second SIGKILL');
 }finally{if(session)await session.ctx.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});
