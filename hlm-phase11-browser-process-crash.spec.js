'use strict';
const {test,expect,chromium}=require('@playwright/test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin='https://phase11-crash-1041.invalid/',moduleText=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8'),J='phase11-atomic-cutover-journal-v1';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
function browserPid(profile){const pids=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x));const found=pids.filter(x=>{try{const cmd=fs.readFileSync('/proc/'+x+'/cmdline','utf8').replace(/\0/g,' ');return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&cmd.includes('chrome')}catch{return false}});if(found.length!==1)throw Error('Expected exactly one persistent Chromium browser process; found '+found.join(','));return Number(found[0])}
async function launch(profile){const ctx=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844},serviceWorkers:'block'});const p=ctx.pages()[0]||await ctx.newPage();await p.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated synthetic crash test</title>'}));await p.goto(origin);await p.addScriptTag({content:moduleText});return {ctx,p}}
async function read(p,key){return p.evaluate(key=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readonly'),r=t.objectStore('state').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>reject(r.error)}}),key)}
async function init(p,value){await p.evaluate(v=>new Promise((resolve,reject)=>{const q=indexedDB.open('hlm_front_office_v8',1);q.onupgradeneeded=()=>q.result.createObjectStore('state');q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('state','readwrite');t.objectStore('state').put(v,'db');t.oncomplete=()=>{d.close();resolve()};t.onerror=()=>reject(t.error)}}),value)}
test('SIGKILL actual Chromium process during synthetic journal write, restart enforces atomic recovery',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-phase11-1041-'));let session;
 try{
  session=await launch(profile);const p=session.p;
  const original={schema:7,settings:{controlledTeamId:42,franchiseName:'Synthetic Crash 1041'},customPlayers:[]};
  const candidate={...original,customPlayers:[{id:9911041,name:'Synthetic Crash Prospect',teamId:42,position:'C'}]};
  await init(p,original);
  const backup=await p.evaluate(async x=>{const payload=JSON.stringify(x),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));return JSON.stringify({format:'hlm-phase11-verified-production-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},present:true,payload,sha256:[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')})},original);
  expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  const pid=browserPid(profile);let signal;const reached=new Promise(resolve=>{signal=resolve});
  p.on('console',msg=>{if(msg.text()==='PHASE11_1041_JOURNAL_QUEUED')signal()});
  await p.evaluate(({candidate,backup})=>{
   const originalPut=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(value,key){const result=originalPut.call(this,value,key);if(key==='phase11-atomic-cutover-journal-v1')console.log('PHASE11_1041_JOURNAL_QUEUED');return result};
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
  console.log('PASS: actual Chromium SIGKILL; atomic pair persisted or rolled back; safe explicit recovery after browser-process restart');
 }finally{if(session)await session.ctx.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});
