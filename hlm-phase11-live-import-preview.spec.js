'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const origin='https://phase11-import-preview-test.invalid/';
const html=fs.readFileSync('phase11-live-import-preview.html','utf8');
const script=fs.readFileSync('hlm-phase11-live-import-preview.js','utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844}});
const roster={meta:{controlledTeamId:1},universe:{teams:[{id:1,name:'One'},{id:2,name:'Two'}],players:[...Array.from({length:6},(_,i)=>({id:i+1,teamId:1,position:i===5?'G':'C',ovr:70})),...Array.from({length:6},(_,i)=>({id:i+7,teamId:2,position:i===5?'G':'C',ovr:70}))]}};
async function setup(page){
 await page.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:html.replace('<script src="./hlm-phase11-live-import-preview.js"></script>','<script>'+script+'</script>')}));
 await page.goto(origin);
 await page.evaluate(r=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(r)),roster);
 await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put({schema:7,settings:{controlledTeamId:42},contracts:[{playerId:99}],history:[{season:2026}],draftPickOverrides:{a:1}},'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}));
}
test('real browser previews protected save fields without writing or activating',async({page})=>{
 await setup(page);
 const before=await page.evaluate(()=>window.HLMPhase11LiveImportPreview.readProduction(indexedDB));
 await page.click('#inspect');await expect(page.locator('#result')).toContainText('"controlledTeamConflict": true');
 await expect(page.locator('#result')).toContainText('"automaticActivationAllowed": false');
 const after=await page.evaluate(()=>window.HLMPhase11LiveImportPreview.readProduction(indexedDB));expect(after).toEqual(before);
 expect(after.contracts).toHaveLength(1);expect(after.history).toHaveLength(1);
});
test('rejects unsupported schema and preserves original save',async({page})=>{
 await setup(page);
 await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put({schema:8,settings:{}},'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}));
 await page.click('#inspect');await expect(page.locator('#result')).toContainText('Unsupported or missing production schema 7');
 expect((await page.evaluate(()=>window.HLMPhase11LiveImportPreview.readProduction(indexedDB))).schema).toBe(8);
});
