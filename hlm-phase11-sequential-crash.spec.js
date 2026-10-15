'use strict';
const {test,expect,chromium}=require('@playwright/test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin='https://phase11-sequential-crash-1047.invalid/',moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8'),J='phase11-atomic-cutover-journal-v1';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
function browserPid(profile){const pids=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x));const found=pids.filter(x=>{try{const cmd=fs.readFileSync('/proc/'+x+'/cmdline','utf8').replace(/\0/g,' ');return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&cmd.includes('chrome')}catch{return false}});if(found.length!==1)throw Error('Expected exactly one persistent Chromium browser process; found '+found.join(','));return Number(found[0])}
async function launch(profile){const ctx=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block'});const p=ctx.pages()[0]||await ctx.newPage();await p.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated synthetic crash test</title>'}));await p.goto(origin);await p.addScriptTag({content:moduleText});return {ctx,p}}
async function read(p,key){return p.evaluate(key=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readonly'),r=t.objectStore('state').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>reject(r.error)}}),key)}
async function init(p,value){await p.evaluate(v=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readwrite');t.objectStore('state').put(v,'db');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)}}),value)}
test('sequential committed guarded saves survive later SIGKILL without rollback',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-phase11-1047-'));let session;
 try{
  session=await launch(profile);const p=session.p;
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Sequential 1047'},customPlayers:[]};
  const version=(n)=>({...original,settings:{...original.settings,franchiseName:'Synthetic committed version '+n},customPlayers:[{id:104700+n,name:'Synthetic '+n,overall:65+n}]});
  const attempt=(page,expected,next)=>page.evaluate(({expected,next})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,expected,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{expected,next});
  await init(p,original);
  let prior=original;
  for(let i=1;i<=4;i++){
   const next=version(i);
   const result=await attempt(p,prior,next);
   expect(result.ok,'legitimate version '+i+' must commit').toBe(true);
   expect(await read(p,'db')).toEqual(next);
   expect(await read(p,J)).toBeUndefined();
   prior=next;
  }
  const baseline=prior,candidate=version(5);
  expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  const pid=browserPid(profile);let signal;const reached=new Promise(resolve=>{signal=resolve});
  p.on('console',msg=>{if(msg.text()==='PHASE11_1047_LATER_PUT_QUEUED')signal()});
  await p.evaluate(({baseline,candidate})=>{
   const put=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(value,key){const r=put.call(this,value,key);if(key==='db')console.log('PHASE11_1047_LATER_PUT_QUEUED');return r};
   HLMPhase11AtomicCutover.guardedSave(indexedDB,baseline,candidate).catch(()=>{});
  },{baseline,candidate});
  await Promise.race([reached,new Promise((_,reject)=>setTimeout(()=>reject(Error('Later guardedSave put not queued')),12000))]);
  process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  const restarted=session.p,actual=await read(restarted,'db');
  expect(JSON.stringify(actual)===JSON.stringify(baseline)||JSON.stringify(actual)===JSON.stringify(candidate),'recovery must retain last committed version 4 or complete version 5').toBe(true);
  expect(actual.customPlayers).toHaveLength(1);
  expect(actual.customPlayers[0].id).toBeGreaterThanOrEqual(104704);
  expect(await read(restarted,J)).toBeUndefined();
  const stale=await attempt(restarted,original,version(6));
  expect(stale.ok).toBe(false);expect(stale.error).toContain('Concurrent save or journal change detected');
  expect(await read(restarted,'db')).toEqual(actual);expect(await read(restarted,J)).toBeUndefined();
  const continuation=version(7);
  expect((await attempt(restarted,actual,continuation)).ok).toBe(true);
  expect(await read(restarted,'db')).toEqual(continuation);expect(await read(restarted,J)).toBeUndefined();
  const secondPid=browserPid(profile);process.kill(secondPid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  expect(await read(session.p,'db')).toEqual(continuation);
  expect(await read(session.p,J)).toBeUndefined();
  expect(await session.p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: four sequential committed saves, fifth write SIGKILL, no rollback below version four, stale rejection, continuation survives second SIGKILL');
 }finally{if(session)await session.ctx.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});
