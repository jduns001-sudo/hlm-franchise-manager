'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const origin='https://phase11-e2e.invalid/',html=fs.readFileSync('app.html','utf8');
const scripts=['hlm-phase11-import-workbench.js','hlm-phase11-cutover-integration.js','hlm-phase11-atomic-cutover.js','hlm-phase11-final-roster-gate.js','hlm-phase11-explicit-activation.js'].map(n=>fs.readFileSync(n,'utf8'));
const universe={teams:[{id:42,name:'Pittsburgh',abbrev:'PIT'}],players:[{id:100,name:'Base Player',teamId:42,position:'C',positions:['C'],ovr:82,age:25,type:'Playmaker'}],seasons:[],draftPicks:[],rookies:[]};
const original={schema:7,draftPickDataVersion:1,settings:{controlledTeamId:42,franchiseName:'Test',season:2026,capLimit:88500000},customPlayers:[],playerOverrides:{},draftPickOverrides:{},extraDraftPicks:[],decisions:[],transactions:[],lines:{},depth:{},contracts:[{playerId:100}],prospects:[],draftBoard:[],history:[{season:2026}],waivers:[],notes:[]};
const staged={universe:{teams:[{id:1,name:'Imported'}],players:[{id:9001,name:'Imported Rookie',teamId:1,position:'C',ovr:79}]}};
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(page){
 await page.route(origin+'**',r=>{const u=r.request().url();if(u.endsWith('/hlm-universe.json'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(universe)});return r.fulfill({status:200,contentType:'text/html',body:u.endsWith('/app.html')?html:'<!doctype html><title>Test workbench</title><select id="map-1"><option value="42" selected>Pittsburgh</option></select>'})});
 await page.goto(origin+'workbench.html');for(const s of scripts)await page.addScriptTag({content:s});
 await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),original);
 await page.evaluate(v=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(v)),staged);
 await page.evaluate(()=>HLMPhase11ImportWorkbench.inspect());
}
async function reopened(page){return page.evaluate(async()=>{const payload=JSON.stringify(await HLMPhase11ImportWorkbench.current()),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)))].map(x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({format:'hlm-phase11-workbench-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},payload,sha256})})}
async function read(page){return page.evaluate(()=>HLMPhase11ImportWorkbench.current())}
test('full opt-in import, actual Front Office reload, exact rollback, no automatic activation',async({page})=>{
 await setup(page);const backup=await reopened(page);
 const result=await page.evaluate(async backup=>{const opts={integration:HLMPhase11CutoverIntegration,finalGate:HLMPhase11FinalRosterGate,workbench:HLMPhase11ImportWorkbench,atomic:HLMPhase11AtomicCutover,fetcher:fetch,storage:localStorage,idb:indexedDB};const off=HLMPhase11ExplicitActivation.create(opts);let disabled=false;try{await off.activate({reopenedBackupText:backup,gmApproval:'I AUTHORIZE PRODUCTION ROSTER IMPORT'})}catch{disabled=true}const on=HLMPhase11ExplicitActivation.create({...opts,enabled:true});const committed=await on.activate({reopenedBackupText:backup,gmApproval:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});return {disabled,committed}},backup);
 expect(result.disabled).toBe(true);expect(result.committed.committed).toBe(true);
 await page.goto(origin+'app.html');await expect(page.locator('#controlled')).toContainText('Pittsburgh',{timeout:15000});await page.evaluate(()=>go('roster'));await expect(page.locator('#view')).toContainText('Imported Rookie');
 await page.reload();await expect(page.locator('#controlled')).toContainText('Pittsburgh',{timeout:15000});await page.evaluate(()=>go('roster'));await expect(page.locator('#view')).toContainText('Imported Rookie');
 await page.goto(origin+'workbench.html');for(const s of scripts)await page.addScriptTag({content:s});
 const status=await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).status());expect(status.journal.phase).toBe('committed');
 const rolled=await page.evaluate(()=>HLMPhase11ExplicitActivation.create({enabled:true,atomic:HLMPhase11AtomicCutover,idb:indexedDB}).rollback({gmApproval:'I AUTHORIZE PRODUCTION ROLLBACK'}));expect(rolled.exactOriginalRestored).toBe(true);expect(await read(page)).toEqual(original);
 await page.goto(origin+'app.html');await expect(page.locator('#controlled')).toContainText('Pittsburgh',{timeout:15000});await page.evaluate(()=>go('roster'));await expect(page.locator('#view')).not.toContainText('Imported Rookie');
});
test('full-universe base player ID collision is rejected without writes',async({page})=>{
 await setup(page);const backup=await reopened(page);
 const rejected=await page.evaluate(async backup=>{const v=JSON.parse(localStorage.getItem('hlm-phase11-imported-franchise-v1'));v.universe.players[0].id=100;localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(v));try{await HLMPhase11ExplicitActivation.create({enabled:true,integration:HLMPhase11CutoverIntegration,finalGate:HLMPhase11FinalRosterGate,workbench:HLMPhase11ImportWorkbench,atomic:HLMPhase11AtomicCutover,fetcher:fetch,storage:localStorage,idb:indexedDB}).activate({reopenedBackupText:backup,gmApproval:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});return false}catch{return true}},backup);
 expect(rejected).toBe(true);expect(await read(page)).toEqual(original);
});
