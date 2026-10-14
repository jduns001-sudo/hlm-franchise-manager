'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const origin='https://phase11-safe-staging.invalid/';
const js=fs.readFileSync('hlm-phase11-safe-import-staging.js','utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(page){await page.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated staging</title>'}));await page.goto(origin);await page.addScriptTag({content:js})}
const original={schema:7,settings:{controlledTeamId:42},customPlayers:[],contracts:[{playerId:7}],history:[{season:2026}],draftPickOverrides:{a:1}};
const plan={automaticCutoverAllowed:false,requiresTeamIdMapping:false,candidateCustomPlayers:[{id:9001,name:'Rookie',teamId:42,position:'C',ovr:78}]};
const receipt={verified:true,sha256:'a'.repeat(64)};
test('isolated journal persists across reload and rollback leaves production save untouched',async({page})=>{
 await setup(page);
 await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),original);
 const before=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,q=db.transaction('state','readonly').objectStore('state').get('db');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}));
 const unauthorized=await page.evaluate(({plan,original,receipt})=>window.HLMPhase11SafeImportStaging.stage(indexedDB,plan,original,receipt,'NO').then(()=>false,()=>true),{plan,original,receipt});expect(unauthorized).toBe(true);
 await page.evaluate(({plan,original,receipt})=>window.HLMPhase11SafeImportStaging.stage(indexedDB,plan,original,receipt,'I AUTHORIZE ISOLATED STAGING'),{plan,original,receipt});
 await page.reload();await page.addScriptTag({content:js});
 const staged=await page.evaluate(()=>window.HLMPhase11SafeImportStaging.inspect(indexedDB));expect(staged.journal.phase).toBe('staged');expect(staged.candidate.customPlayers).toHaveLength(1);
 await page.evaluate(()=>window.HLMPhase11SafeImportStaging.rollback(indexedDB,'I AUTHORIZE STAGING ROLLBACK'));
 const clean=await page.evaluate(()=>window.HLMPhase11SafeImportStaging.inspect(indexedDB));expect(clean.journal).toBeNull();expect(clean.candidate).toBeNull();
 const after=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,q=db.transaction('state','readonly').objectStore('state').get('db');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}));expect(after).toEqual(before);
});
test('refuses unverified backups, unmapped teams and repeated staging',async({page})=>{
 await setup(page);
 const bad=await page.evaluate(({plan,original})=>window.HLMPhase11SafeImportStaging.stage(indexedDB,plan,original,{verified:false},'I AUTHORIZE ISOLATED STAGING').then(()=>false,()=>true),{plan,original});expect(bad).toBe(true);
 const unmapped=await page.evaluate(({plan,original,receipt})=>window.HLMPhase11SafeImportStaging.stage(indexedDB,{...plan,requiresTeamIdMapping:true},original,receipt,'I AUTHORIZE ISOLATED STAGING').then(()=>false,()=>true),{plan,original,receipt});expect(unmapped).toBe(true);
 await page.evaluate(({plan,original,receipt})=>window.HLMPhase11SafeImportStaging.stage(indexedDB,plan,original,receipt,'I AUTHORIZE ISOLATED STAGING'),{plan,original,receipt});
 const repeated=await page.evaluate(({plan,original,receipt})=>window.HLMPhase11SafeImportStaging.stage(indexedDB,plan,original,receipt,'I AUTHORIZE ISOLATED STAGING').then(()=>false,()=>true),{plan,original,receipt});expect(repeated).toBe(true);
});
