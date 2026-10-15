'use strict';
const {test,expect,chromium}=require('@playwright/test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin='https://phase11-handoff-1043.invalid/',moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8'),J='phase11-atomic-cutover-journal-v1';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
function browserPid(profile){const pids=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x));const found=pids.filter(x=>{try{const cmd=fs.readFileSync('/proc/'+x+'/cmdline','utf8').replace(/\0/g,' ');return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&cmd.includes('chrome')}catch{return false}});if(found.length!==1)throw Error('Expected exactly one persistent Chromium browser process; found '+found.join(','));return Number(found[0])}
async function launch(profile){const ctx=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block'});const p=ctx.pages()[0]||await ctx.newPage();await p.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated synthetic crash test</title>'}));await p.goto(origin);await p.addScriptTag({content:moduleText});return {ctx,p}}
async function read(p,key){return p.evaluate(key=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readonly'),r=t.objectStore('state').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>reject(r.error)}}),key)}
async function init(p,value){await p.evaluate(v=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readwrite');t.objectStore('state').put(v,'db');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)}}),value)}
test('independent Chromium processes hand off recovered profile; stale process snapshot cannot overwrite committed save',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-phase11-1043-'));let session;
 try{
  session=await launch(profile);const p=session.p;
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Crash 1043'},customPlayers:[]};
  const candidate={...original,customPlayers:[{id:9911043,name:'Synthetic Crash Prospect',teamId:42,position:'C'}]};
  await init(p,original);
  const backup=await p.evaluate(async x=>{const payload=JSON.stringify(x),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));return JSON.stringify({format:'hlm-phase11-verified-production-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},present:true,payload,sha256:[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')})},original);
  expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  const pid=browserPid(profile);let signal;const reached=new Promise(resolve=>{signal=resolve});
  p.on('console',msg=>{if(msg.text()==='PHASE11_1043_JOURNAL_QUEUED')signal()});
  await p.evaluate(({candidate,backup})=>{
   const originalPut=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(value,key){const result=originalPut.call(this,value,key);if(key==='phase11-atomic-cutover-journal-v1')console.log('PHASE11_1043_JOURNAL_QUEUED');return result};
   HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:backup,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}).catch(()=>{});
  },{candidate,backup});
  await Promise.race([reached,new Promise((_,reject)=>setTimeout(()=>reject(Error('Journal was never queued')),12000))]);
  process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);const restarted=session.p;
  const saved=await read(restarted,'db'),journal=await read(restarted,J);
  const untouched=JSON.stringify(saved)===JSON.stringify(original)&&journal===undefined;
  const committed=JSON.stringify(saved)===JSON.stringify(candidate)&&journal?.phase==='committed';
  expect(untouched||committed,'Crash recovery must have either entire old state or entire committed state plus journal').toBe(true);
  const status=await restarted.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status());
  if(committed){
   expect(status).toMatchObject({cutoverEnabled:false,journalPresent:true,journalBackupIntegrity:true,journalActiveIntegrity:true,journalRecoveryReady:true});
   const rollback=await restarted.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).rollback('I AUTHORIZE PRODUCTION ROLLBACK'));
   expect(rollback).toMatchObject({rolledBack:true,exactOriginalRestored:true});
  }else expect(status).toMatchObject({cutoverEnabled:false,journalPresent:false,recoveryRequired:false});
  expect(await read(restarted,'db')).toEqual(original);expect(await read(restarted,J)).toBeUndefined();
  expect(await restarted.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  // Browser A commits a legitimate guarded save. Browser B will later use its stale snapshot.
  const winner={...original,settings:{...original.settings,franchiseName:'Process A committed'}};
  const staleCandidate={...original,settings:{...original.settings,franchiseName:'Process B stale attempt'}};
  const attempt=(page,next,expected)=>page.evaluate(({next,expected})=>HLMPhase11AtomicCutover.guardedSave(indexedDB,expected,next).then(()=>({ok:true}),e=>({ok:false,error:String(e)})),{next,expected});
  const pidA=browserPid(profile);
  const committedWrite=await attempt(restarted,winner,original);
  expect(committedWrite.ok).toBe(true);
  expect(await read(restarted,'db')).toEqual(winner);
  expect(await read(restarted,J)).toBeUndefined();
  // Separate Chromium process B acquires the same persistent profile only after A exits.
  // Chromium does not support two simultaneous browser owners of one user-data-dir.
  await session.ctx.close();session=null;
  session=await launch(profile);
  const pidB=browserPid(profile);
  expect(pidB).not.toBe(pidA);
  const otherProcess=session.p;
  expect(await read(otherProcess,'db')).toEqual(winner);
  const stale=await attempt(otherProcess,staleCandidate,original);
  expect(stale.ok).toBe(false);
  expect(stale.error).toContain('Concurrent save or journal change detected');
  expect(await read(otherProcess,'db')).toEqual(winner);
  expect(await read(otherProcess,J)).toBeUndefined();
  // Process B can write only after refreshing the expected state.
  const refreshed={...winner,settings:{...winner.settings,franchiseName:'Process B refreshed'}};
  const accepted=await attempt(otherProcess,refreshed,winner);
  expect(accepted.ok).toBe(true);
  expect(await read(otherProcess,'db')).toEqual(refreshed);
  expect(await read(otherProcess,J)).toBeUndefined();
  const pidBeforeCrash=browserPid(profile);
  process.kill(pidBeforeCrash,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1200));
  session=await launch(profile);
  expect(browserPid(profile)).not.toBe(pidBeforeCrash);
  expect(await read(session.p,'db')).toEqual(refreshed);
  expect(await read(session.p,J)).toBeUndefined();
  expect(await session.p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: distinct Chromium PIDs sequentially own persistent profile; stale process snapshot rejected, refreshed save accepted, SIGKILL restart retains committed state and journal integrity');
 }finally{if(session)await session.ctx.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});
