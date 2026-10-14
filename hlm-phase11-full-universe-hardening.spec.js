'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const code=['hlm-phase11-import-workbench.js','hlm-phase11-cutover-integration.js','hlm-phase11-atomic-cutover.js','hlm-phase11-final-roster-gate.js','hlm-phase11-explicit-activation.js'].map(n=>fs.readFileSync(n,'utf8'));
const origin='https://phase11-universe-hardening.invalid/';
const base={teams:[{id:42,name:'Pittsburgh'}],players:[{id:100,teamId:42,name:'Base'}]};
const original={schema:7,settings:{controlledTeamId:42},customPlayers:[],contracts:[{playerId:100}],draftPickOverrides:{pick:42},history:[{season:2026}]};
const imported={universe:{teams:[{id:1,name:'Imported'}],players:[{id:9001,name:'New Rookie',teamId:1,position:'C',ovr:79}]}};
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(page){await page.route(origin+'**',r=>r.request().url().endsWith('/hlm-universe.json')?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(base)}):r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><select id="map-1"><option value="42" selected>Team</option></select>'}));await page.goto(origin);for(const s of code)await page.addScriptTag({content:s});await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),original);await page.evaluate(v=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(v)),imported);await page.evaluate(()=>HLMPhase11ImportWorkbench.inspect())}
test('newly collided player in refreshed production universe is rejected before any commit',async({page})=>{
 await setup(page);
 const rejected=await page.evaluate(async()=>{
  const originalFetch=window.fetch;window.fetch=async()=>({ok:true,json:async()=>({teams:[{id:42,name:'Pittsburgh'}],players:[{id:100,teamId:42},{id:9001,teamId:42}]})});
  try{await HLMPhase11CutoverIntegration.preflight(HLMPhase11ImportWorkbench,window.fetch,localStorage);return false}catch{return true}finally{window.fetch=originalFetch}
 });expect(rejected).toBe(true);expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(original);
});
test('GM approval without reopened backup never activates',async({page})=>{
 await setup(page);const blocked=await page.evaluate(async()=>{try{await HLMPhase11ExplicitActivation.create({enabled:true,integration:HLMPhase11CutoverIntegration,finalGate:HLMPhase11FinalRosterGate,workbench:HLMPhase11ImportWorkbench,atomic:HLMPhase11AtomicCutover,fetcher:fetch,storage:localStorage,idb:indexedDB}).activate({gmApproval:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});return false}catch{return true}});expect(blocked).toBe(true);expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(original);
});
