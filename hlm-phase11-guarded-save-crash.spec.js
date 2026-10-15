'use strict';
const {test,expect,chromium}=require('@playwright/test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin='https://phase11-guarded-crash-1044.invalid/',moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8'),J='phase11-atomic-cutover-journal-v1';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
function browserPid(profile){const pids=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x));const found=pids.filter(x=>{try{const cmd=fs.readFileSync('/proc/'+x+'/cmdline','utf8').replace(/\0/g,' ');return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&cmd.includes('chrome')}catch{return false}});if(found.length!==1)throw Error('Expected exactly one persistent Chromium browser process; found '+found.join(','));return Number(found[0])}
async function launch(profile){const ctx=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block'});const p=ctx.pages()[0]||await ctx.newPage();await p.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated synthetic crash test</title>'}));await p.goto(origin);await p.addScriptTag({content:moduleText});return {ctx,p}}
async function read(p,key){return p.evaluate(key=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readonly'),r=t.objectStore('state').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>reject(r.error)}}),key)}
async function init(p,value){await p.evaluate(v=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readwrite');t.objectStore('state').put(v,'db');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)}}),value)}
test('SIGKILL during real guardedSave IndexedDB put; restart validates atomic old-or-new state and stale guard',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-phase11-1044-'));let session;
 try{
  session=await launch(profile);const p=session.p;
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Guarded 1044'},customPlayers:[]};
  const candidate={...original,settings:{...original.settings,franchiseName:'Synthetic Guarded Winner'}};
  await init(p,original);
  expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  const pid=browserPid(profile);let signal;const reached=new Promise(resolve=>{signal=resolve});
  p.on('console',msg=>{if(msg.text()==='PHASE11_1044_SAVE_QUEUED')signal()});
  await p.evaluate(({original,candidate})=>{
   const put=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(value,key){const r=put.call(this,value,key);if(key==='db')console.log('PHASE11_1044_SAVE_QUEUED');return r};
   HLMPhase11AtomicCutover.guardedSave(indexedDB,original,candidate).catch(()=>{});
  },{original,candidate});
  await Promise.race([reached,new Promise((_,reject)=>setTimeout(()=>reject(Error('guardedSave put was never queued')),12000))]);
  process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  const restarted=session.p,saved=await read(restarted,'db'),journal=await read(restarted,J);
  expect(JSON.stringify(saved)===JSON.stringify(original)||JSON.stringify(saved)===JSON.stringify(candidate),'guardedSave must be entirely old or entirely new').toBe(true);
  expect(journal).toBeUndefined();
  const attempt=(next,expected)=>restarted.evaluate(({next,expected})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,expected,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{next,expected});
  const staleExpected=JSON.stringify(saved)===JSON.stringify(original)?candidate:original;
  const stale=await attempt({...saved,settings:{...saved.settings,franchiseName:'Stale attempt'}},staleExpected);
  expect(stale.ok).toBe(false);expect(stale.error).toContain('Concurrent save or journal change detected');
  expect(await read(restarted,'db')).toEqual(saved);expect(await read(restarted,J)).toBeUndefined();
  const fresh={...saved,settings:{...saved.settings,franchiseName:'Fresh legitimate guarded save'}};
  const accepted=await attempt(fresh,saved);expect(accepted.ok).toBe(true);
  expect(await read(restarted,'db')).toEqual(fresh);expect(await read(restarted,J)).toBeUndefined();
  const secondPid=browserPid(profile);process.kill(secondPid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  expect(await read(session.p,'db')).toEqual(fresh);expect(await read(session.p,J)).toBeUndefined();
  expect(await session.p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: actual SIGKILL during guardedSave put, atomic old-or-new recovery, stale rejection, fresh save and second process restart preserve state and no journal');
 }finally{if(session)await session.ctx.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});
