'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const origin='https://phase11-integration.invalid/';
const html=fs.readFileSync('phase11-import-workbench.html','utf8');
const scripts=['hlm-phase11-import-workbench.js','hlm-phase11-cutover-integration.js','hlm-phase11-atomic-cutover.js'];
const code=Object.fromEntries(scripts.map(p=>[p,fs.readFileSync(p,'utf8')]));
const universe={teams:[{id:42,name:'Pittsburgh'},{id:43,name:'Other'}],players:[{id:100,name:'Base'}]};
const live={schema:7,settings:{controlledTeamId:42},customPlayers:[{id:800,name:'Existing',teamId:42}],contracts:[{playerId:100}],draftPickOverrides:{a:1},history:[{season:2026}],lines:{a:[100]}};
const imported={universe:{teams:[{id:1,name:'Imported A'},{id:2,name:'Imported B'}],players:[{id:9001,name:'Rookie',teamId:1,position:'C',ovr:80},{id:9002,name:'Goalie',teamId:2,position:'G',ovr:77}]}};
test.use({browserName:'chromium',viewport:{width:390,height:844},acceptDownloads:true});
async function setup(page){
 await page.route(origin+'**',r=>{const url=r.request().url();if(url.endsWith('hlm-universe.json'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(universe)});for(const [path,js] of Object.entries(code))if(url.endsWith(path))return r.fulfill({status:200,contentType:'text/javascript',body:js});return r.fulfill({status:200,contentType:'text/html',body:html})});
 await page.goto(origin);
 await page.evaluate(x=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(x)),imported);
 await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),live);
 await page.click('#load');await page.selectOption('#map-1','42');await page.selectOption('#map-2','43');
}
test('end to end: real-universe preflight, reopened backup, test-only atomic commit, reload, exact rollback',async({page})=>{
 await setup(page);await page.click('#cutover-preflight');await expect(page.locator('#status')).toContainText('preflight passed');
 const download=page.waitForEvent('download');await page.click('#backup');const file=await download;const path=await file.path();const text=fs.readFileSync(path,'utf8');
 await page.locator('#reopen').setInputFiles(path);await expect(page.locator('#status')).toContainText('backupVerified');
 const result=await page.evaluate(async text=>{
  const bridge=HLMPhase11CutoverIntegration,workbench=HLMPhase11ImportWorkbench;
  const verified=await bridge.verifyReopenedBackup(text,workbench),plan=await bridge.preflight(workbench,fetch,localStorage);
  const controller=HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}); // test harness only, not exposed in UI
  const committed=await controller.commit({candidate:plan.candidate,backupText:verified.cutoverBackupText,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});
  return {committed,controlledTeamId:plan.controlledTeamId};
 },text);
 expect(result.committed.committed).toBe(true);expect(result.controlledTeamId).toBe(42);
 await page.reload();
 const journal=await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).status());expect(journal.journal.phase).toBe('committed');
 const restored=await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).rollback('I AUTHORIZE PRODUCTION ROLLBACK'));expect(restored.exactOriginalRestored).toBe(true);
 expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(live);
});
test('base player collision blocks preflight before any production mutation',async({page})=>{
 await setup(page);await page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('hlm-phase11-imported-franchise-v1'));x.universe.players[0].id=100;localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(x))});
 await page.click('#cutover-preflight');await expect(page.locator('#status')).toContainText('collision');
 expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(live);
});
test('default cutover disabled even after successful full preflight',async({page})=>{
 await setup(page);const blocked=await page.evaluate(async()=>{const plan=await HLMPhase11CutoverIntegration.preflight(HLMPhase11ImportWorkbench,fetch,localStorage);return HLMPhase11AtomicCutover.createController(indexedDB).commit({candidate:plan.candidate,backupText:'{}',authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}).then(()=>false,()=>true)});expect(blocked).toBe(true);
});
