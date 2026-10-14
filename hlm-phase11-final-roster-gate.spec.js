'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const origin='https://phase11-final-gate.invalid/';
const js=['hlm-phase11-import-workbench.js','hlm-phase11-cutover-integration.js','hlm-phase11-atomic-cutover.js','hlm-phase11-final-roster-gate.js'].map(p=>fs.readFileSync(p,'utf8'));
const universe={teams:[{id:42,name:'Pittsburgh'}],players:[{id:100,name:'Base'}]};
const save={schema:7,settings:{controlledTeamId:42},customPlayers:[],contracts:[{playerId:100}],draftPickOverrides:{a:1},history:[{season:2026}]};
const imported={universe:{teams:[{id:1,name:'Imported'}],players:[{id:9001,name:'Rookie',teamId:1,position:'C',ovr:79}]}};
test.use({browserName:'chromium',viewport:{width:390,height:844},acceptDownloads:true});
async function setup(page){
 await page.route(origin+'**',r=>r.request().url().endsWith('/hlm-universe.json')?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(universe)}):r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Final Gate</title>'}));
 await page.goto(origin);for(const script of js)await page.addScriptTag({content:script});
 await page.evaluate(x=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(x)),imported);
 await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),save);
 await page.evaluate(async()=>{const w=HLMPhase11ImportWorkbench;await w.inspect();document.body.insertAdjacentHTML('beforeend','<select id="map-1"><option value="42" selected>Pittsburgh</option></select>')});
}
async function backup(page){return page.evaluate(async()=>{const w=HLMPhase11ImportWorkbench,state=await w.current(),payload=JSON.stringify(state),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)))].map(x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({format:'hlm-phase11-workbench-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},payload,sha256})})}
test('final readiness gate preserves production and defaults disabled',async({page})=>{
 await setup(page);const text=await backup(page);
 const result=await page.evaluate(async text=>HLMPhase11FinalRosterGate.validate({integration:HLMPhase11CutoverIntegration,workbench:HLMPhase11ImportWorkbench,fetcher:fetch,storage:localStorage,backupText:text,atomic:HLMPhase11AtomicCutover}),text);
 expect(result.readyForControlledTest).toBe(true);expect(result.productionActivationEnabled).toBe(false);expect(result.protectedFieldsPreserved).toBe(true);
 expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(save);
});
test('late collision and altered backup reject before activation',async({page})=>{
 await setup(page);const text=await backup(page);
 const reject=await page.evaluate(async text=>{const x=JSON.parse(localStorage.getItem('hlm-phase11-imported-franchise-v1'));x.universe.players[0].id=100;localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(x));try{await HLMPhase11FinalRosterGate.validate({integration:HLMPhase11CutoverIntegration,workbench:HLMPhase11ImportWorkbench,fetcher:fetch,storage:localStorage,backupText:text,atomic:HLMPhase11AtomicCutover});return false}catch{return true}},text);expect(reject).toBe(true);
});
