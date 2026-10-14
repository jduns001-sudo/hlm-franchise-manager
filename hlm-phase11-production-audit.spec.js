'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const universe=JSON.parse(fs.readFileSync('hlm-universe.json','utf8'));
const source=fs.readFileSync('hlm-phase11-import-workbench.js','utf8');
const origin='https://phase11-production-audit.invalid/';
const base={schema:7,settings:{controlledTeamId:universe.teams[0].id},customPlayers:[],contracts:[{id:11}],history:[{season:2026}],draftPickOverrides:{keep:true}};
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(page,players){
 await page.route(origin+'**',route=>route.request().url().endsWith('/hlm-universe.json')?route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(universe)}):route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated audit</title>'}));
 await page.goto(origin);await page.addScriptTag({content:source});
 await page.evaluate(state=>new Promise((resolve,reject)=>{const req=indexedDB.open('hlm_front_office_v8',1);req.onupgradeneeded=()=>req.result.createObjectStore('state');req.onsuccess=()=>{const db=req.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};req.onerror=()=>reject(req.error)}),base);
 await page.evaluate(players=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify({universe:{teams:[{id:1,name:'Incoming'}],players}})),players);
}
const player=id=>({id,name:'Audit Player',teamId:1,position:'C',ovr:72});
test('real universe collision blocks inspection without production writes',async({page})=>{
 await setup(page,[player(universe.players[0].id)]);
 const result=await page.evaluate(async()=>{try{await HLMPhase11ImportWorkbench.inspect();return 'accepted'}catch(e){return e.message}});
 expect(result).toMatch(/collision/i);
 expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(base);
});
test('duplicate imported player IDs block inspection without production writes',async({page})=>{
 await setup(page,[player(987654321),player(987654321)]);
 const result=await page.evaluate(async()=>{try{await HLMPhase11ImportWorkbench.inspect();return 'accepted'}catch(e){return e.message}});
 expect(result).toMatch(/invalid imported players/i);
 expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(base);
});
test('reopened backup rejects tampering and staging remains authorization gated',async({page})=>{
 await setup(page,[player(987654321)]);
 const result=await page.evaluate(async()=>{
  await HLMPhase11ImportWorkbench.inspect();
  const sha=await HLMPhase11ImportWorkbench.capture();
  let unauthorized=false,tampered=false;
  try{await HLMPhase11ImportWorkbench.stage('')}catch{unauthorized=true}
  try{await HLMPhase11ImportWorkbench.verify(JSON.stringify({format:'hlm-phase11-workbench-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},sha256:sha,payload:'{}'}))}catch{tampered=true}
  return {unauthorized,tampered,live:await HLMPhase11ImportWorkbench.current()};
 });
 expect(result.unauthorized).toBe(true);expect(result.tampered).toBe(true);expect(result.live).toEqual(base);
});
