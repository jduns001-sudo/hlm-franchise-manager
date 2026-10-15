'use strict';
const {test,expect,chromium}=require('@playwright/test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin='https://phase11-repeated-crash-1048.invalid/',moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8'),J='phase11-atomic-cutover-journal-v1';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
function browserPid(profile){const pids=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x));const found=pids.filter(x=>{try{const cmd=fs.readFileSync('/proc/'+x+'/cmdline','utf8').replace(/\0/g,' ');return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&cmd.includes('chrome')}catch{return false}});if(found.length!==1)throw Error('Expected exactly one persistent Chromium browser process; found '+found.join(','));return Number(found[0])}
async function launch(profile){const ctx=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block'});const p=ctx.pages()[0]||await ctx.newPage();await p.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated synthetic crash test</title>'}));await p.goto(origin);await p.addScriptTag({content:moduleText});return {ctx,p}}
async function read(p,key){return p.evaluate(key=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readonly'),r=t.objectStore('state').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>reject(r.error)}}),key)}
async function init(p,value){await p.evaluate(v=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readwrite');t.objectStore('state').put(v,'db');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)}}),value)}
test('repeated real browser SIGKILL during separate guarded saves preserves monotonic committed state',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-phase11-1048-'));let session;
 try{
  session=await launch(profile);
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Repeated Crash 1048'},customPlayers:[]};
  const version=(n)=>({...original,settings:{...original.settings,franchiseName:'Synthetic durable version '+n},customPlayers:[{id:104800+n,name:'Synthetic durable '+n,overall:60+n}]});
  const attempt=(p,expected,next)=>p.evaluate(({expected,next})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,expected,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{expected,next});
  await init(session.p,original);
  let durable=original;
  for(let round=1;round<=3;round++){
   const p=session.p,committed=version(round*10),candidate=version(round*10+1);
   expect((await attempt(p,durable,committed)).ok,'round '+round+' baseline must commit').toBe(true);
   expect(await read(p,'db')).toEqual(committed);
   expect(await read(p,J)).toBeUndefined();
   expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
   const pid=browserPid(profile);
   const marker='PHASE11_1048_PUT_'+round;
   let signal;const queued=new Promise(resolve=>{signal=resolve});
   p.on('console',msg=>{if(msg.text()===marker)signal()});
   await p.evaluate(({committed,candidate,marker})=>{
    const put=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(value,key){const r=put.call(this,value,key);if(key==='db')console.log(marker);return r};
    HLMPhase11AtomicCutover.guardedSave(indexedDB,committed,candidate).catch(()=>{});
   },{committed,candidate,marker});
   await Promise.race([queued,new Promise((_,reject)=>setTimeout(()=>reject(Error('Round '+round+' guardedSave put not queued')),12000))]);
   process.kill(pid,'SIGKILL');
   await new Promise(resolve=>setTimeout(resolve,1200));
   session=await launch(profile);
   const recovered=await read(session.p,'db');
   expect(JSON.stringify(recovered)===JSON.stringify(committed)||JSON.stringify(recovered)===JSON.stringify(candidate),'round '+round+' must recover only committed baseline or complete candidate').toBe(true);
   expect(recovered.customPlayers).toHaveLength(1);
   expect(recovered.customPlayers[0].id).toBeGreaterThanOrEqual(committed.customPlayers[0].id);
   expect(await read(session.p,J)).toBeUndefined();
   const stale=await attempt(session.p,durable,version(90+round));
   expect(stale.ok,'round '+round+' obsolete snapshot must reject').toBe(false);
   expect(stale.error).toContain('Concurrent save or journal change detected');
   expect(await read(session.p,'db')).toEqual(recovered);
   expect(await read(session.p,J)).toBeUndefined();
   durable=recovered;
  }
  const final=version(100);
  expect((await attempt(session.p,durable,final)).ok).toBe(true);
  expect(await read(session.p,'db')).toEqual(final);
  expect(await read(session.p,J)).toBeUndefined();
  const pid=browserPid(profile);process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  expect(await read(session.p,'db')).toEqual(final);
  expect(await read(session.p,J)).toBeUndefined();
  expect(await session.p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: three separate guardedSave write SIGKILL rounds, monotonic committed recovery, stale rejection, journal absent, final save survives fourth SIGKILL');
 }finally{if(session)await session.ctx.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});
