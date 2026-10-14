'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const code=fs.readFileSync('hlm-phase11-import-workbench.js','utf8');
const origin='https://phase11-large-mapping.invalid/';
const teams=[{id:42,name:'Pittsburgh'},{id:43,name:'Boston'},{id:44,name:'New York'}];
const universe={teams,players:Array.from({length:3000},(_,i)=>({id:i+1,name:'Base '+i,teamId:teams[i%3].id,position:'C',ovr:65}))};
const imported={universe:{teams:[{id:1,name:'Incoming A'},{id:2,name:'Incoming B'},{id:3,name:'Incoming C'}],players:Array.from({length:450},(_,i)=>({id:10000+i,name:'Prospect '+i,teamId:i%3+1,position:i%5===0?'G':'C',ovr:60+i%30}))}};
const live={schema:7,settings:{controlledTeamId:42,season:2026},customPlayers:[{id:9000,name:'Existing Custom',teamId:42}],contracts:[{id:88}],history:[{season:2026}],draftPickOverrides:{'2027':42}};
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(page){
 await page.route(origin+'**',r=>r.request().url().endsWith('/hlm-universe.json')?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(universe)}):r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><select id="map-1"><option value="42" selected>Pittsburgh</option></select><select id="map-2"><option value="43" selected>Boston</option></select><select id="map-3"><option value="44" selected>New York</option></select>'}));
 await page.goto(origin);await page.addScriptTag({content:code});
 await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),live);
 await page.evaluate(v=>localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(v)),imported);
}
test('450 players across three explicit mappings preserve schema 7 protected state and do not write',async({page})=>{
 await setup(page);
 const result=await page.evaluate(async()=>{const inspection=await HLMPhase11ImportWorkbench.inspect(),mapping=HLMPhase11ImportWorkbench.assignments(),candidate=HLMPhase11ImportWorkbench.candidate();return {inspection,mapping,candidate,live:await HLMPhase11ImportWorkbench.current()}});
 expect(result.inspection.players).toBe(450);expect(result.mapping).toEqual({'1':42,'2':43,'3':44});
 expect(result.candidate.state.customPlayers).toHaveLength(451);
 expect(result.candidate.state.customPlayers.filter(p=>p.teamId===42)).toHaveLength(151);
 expect(result.candidate.state.customPlayers.filter(p=>p.teamId===43)).toHaveLength(150);
 expect(result.candidate.state.customPlayers.filter(p=>p.teamId===44)).toHaveLength(150);
 expect(result.candidate.state.contracts).toEqual(live.contracts);expect(result.candidate.state.history).toEqual(live.history);expect(result.candidate.state.draftPickOverrides).toEqual(live.draftPickOverrides);
 expect(result.live).toEqual(live);
});
test('duplicate destination mapping blocks all 450 imported players with no save changes',async({page})=>{
 await setup(page);await page.evaluate(()=>HLMPhase11ImportWorkbench.inspect());await page.selectOption('#map-2','43').catch(()=>{});await page.evaluate(()=>document.getElementById('map-2').innerHTML='<option value="42" selected>Pittsburgh</option>');
 const rejected=await page.evaluate(()=>{try{HLMPhase11ImportWorkbench.candidate();return false}catch{return true}});expect(rejected).toBe(true);expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(live);
});
test('collision against high-index base universe player blocks before candidate',async({page})=>{
 await setup(page);await page.evaluate(()=>{const v=JSON.parse(localStorage.getItem('hlm-phase11-imported-franchise-v1'));v.universe.players[449].id=3000;localStorage.setItem('hlm-phase11-imported-franchise-v1',JSON.stringify(v))});
 const rejected=await page.evaluate(async()=>{try{await HLMPhase11ImportWorkbench.inspect();return false}catch{return true}});expect(rejected).toBe(true);expect(await page.evaluate(()=>HLMPhase11ImportWorkbench.current())).toEqual(live);
});
