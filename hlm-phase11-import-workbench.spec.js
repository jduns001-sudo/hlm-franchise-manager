'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const origin='https://phase11-workbench.invalid/';
const html=fs.readFileSync('phase11-import-workbench.html','utf8'),script=fs.readFileSync('hlm-phase11-import-workbench.js','utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844},acceptDownloads:true});
const live={schema:7,settings:{controlledTeamId:42},customPlayers:[],contracts:[{playerId:7}],history:[{season:2026}],draftPickOverrides:{x:1}};
async function setup(page){
 await page.route(origin+'**',r=>r.request().url().endsWith('/hlm-universe.json')?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({teams:[{id:42,name:'Pittsburgh'},{id:43,name:'Other'}],players:[{id:101}]})}):r.fulfill({status:200,contentType:'text/html',body:html.replace('<script src="./hlm-phase11-import-workbench.js"></script>','<script>'+script+'</script>')}));
 await page.goto(origin);
 await page.evaluate(()=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify({universe:{teams:[{id:1,name:'A'},{id:2,name:'B'}],players:[{id:9001,name:'A Rookie',teamId:1,position:'C',ovr:77},{id:9002,name:'B Rookie',teamId:2,position:'G',ovr:75}]}})));
 await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),live);
}
test('mobile workflow requires verified reopened backup, explicit team mapping and authorization; isolated rollback preserves live save',async({page})=>{
 await setup(page);await page.click('#load');await expect(page.locator('#map-1')).toBeVisible();
 await page.selectOption('#map-1','42');await page.selectOption('#map-2','43');
 const before=await page.evaluate(()=>HLMPhase11ImportWorkbench.current());
 const denied=await page.evaluate(()=>HLMPhase11ImportWorkbench.stage('I AUTHORIZE ISOLATED STAGING').then(()=>false,()=>true));expect(denied).toBe(true);
 const download=page.waitForEvent('download');await page.click('#backup');const file=await download;const path=await file.path();await page.locator('#reopen').setInputFiles(path);await expect(page.locator('#status')).toContainText('backupVerified');
 await page.fill('#authorization','I AUTHORIZE ISOLATED STAGING');await page.click('#stage');await expect(page.locator('#status')).toContainText('"stagedPlayers": 2');
 const db=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_phase11_workbench_staging_v1');r.onsuccess=()=>{const d=r.result,q=d.transaction('records','readonly').objectStore('records').get('candidate');q.onsuccess=()=>{d.close();resolve(q.result)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}));expect(db.customPlayers).toHaveLength(2);expect(db.contracts).toEqual(live.contracts);expect(db.history).toEqual(live.history);
 await page.reload();await page.click('#rollback');await expect(page.locator('#status')).toContainText('"rolledBack": true');
 const after=await page.evaluate(()=>HLMPhase11ImportWorkbench.current());expect(after).toEqual(before);
});
test('rejects duplicate imported base player IDs before staging',async({page})=>{
 await setup(page);await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('hlm-phase11-imported-franchise-v1'));s.universe.players[0].id=101;localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(s))});
 await page.click('#load');await expect(page.locator('#status')).toContainText('player ID collisions');
});
