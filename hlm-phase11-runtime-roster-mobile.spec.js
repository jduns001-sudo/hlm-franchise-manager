'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync('app.html','utf8');
const universe=JSON.parse(fs.readFileSync('hlm-universe.json','utf8'));
const origin='https://phase11-runtime-roster.invalid/';
const imported={id:987654321,name:'Phase Eleven Mobile Import',teamId:universe.teams[0].id,team:universe.teams[0].id,position:'C',positions:['C'],ovr:81,overall:81,type:'Playmaker',age:20};
const state={schema:7,settings:{controlledTeamId:universe.teams[0].id,franchiseName:'Safety Test',season:2026,capLimit:88500000},customPlayers:[imported],playerOverrides:{},draftPickOverrides:{},extraDraftPicks:[],decisions:[],transactions:[],lines:{},depth:{},contracts:[],prospects:[],draftBoard:[],history:[],waivers:[],notes:[]};
test.use({browserName:'chromium',viewport:{width:390,height:844}});
test('mobile browser loads actual app.html and renders saved imported player without cutover',async({page})=>{
 await page.route(origin+'**',route=>{const url=route.request().url();if(url.endsWith('/app.html'))return route.fulfill({status:200,contentType:'text/html',body:html});if(url.endsWith('/hlm-universe.json'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(universe)});const name=decodeURIComponent(new URL(url).pathname.slice(1));if(name.includes('..'))return route.abort();const file=path.join(process.cwd(),name);if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({status:200,contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.json')?'application/json':'text/plain',body:fs.readFileSync(file)});return route.fulfill({status:404,body:'Not found'})});
 await page.goto(origin+'app.html');
 await page.evaluate(v=>new Promise((resolve,reject)=>{const req=indexedDB.open('hlm_front_office_v8',1);req.onupgradeneeded=()=>req.result.createObjectStore('state');req.onsuccess=()=>{const db=req.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};req.onerror=()=>reject(req.error)}),state);
 await page.reload();
 await expect(page.locator('#view')).toBeVisible({timeout:45000});
 await page.evaluate(()=>go('roster'));
 await expect(page.locator('#view')).toContainText(imported.name,{timeout:30000});
 const row=page.locator('#view tr').filter({hasText:imported.name});
 await expect(row).toContainText('81');
 await expect(row).toContainText('C');
 const persisted=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readonly'),q=tx.objectStore('state').get('db');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}));
 expect(persisted.customPlayers).toEqual(state.customPlayers);
 expect(persisted.settings).toEqual(state.settings);
});
test('mobile activation remains disabled and no automatic cutover wiring exists',async()=>{
 expect(html).not.toContain('HLMPhase11AtomicCutover.createController');
 expect(fs.readFileSync('hlm-phase11-cutover-integration.js','utf8')).toContain('productionCutoverEnabled:false');
});
