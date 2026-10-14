'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const code=fs.readFileSync('hlm-phase11-playable-roster-proof.js','utf8'),atomic=fs.readFileSync('hlm-phase11-atomic-cutover.js','utf8');
const origin='https://phase11-roster-proof.invalid/';
const universe={teams:[{id:42,name:'Pittsburgh'}],players:[{id:100,name:'Base',teamId:42}]};
const original={schema:7,settings:{controlledTeamId:42},customPlayers:[],contracts:[{playerId:100}],draftPickOverrides:{a:1},history:[{season:2026}]};
const candidate={...original,customPlayers:[{id:9001,name:'Imported Rookie',teamId:42,position:'C',ovr:79}]};
test.use({browserName:'chromium',viewport:{width:390,height:844}});
async function setup(page){await page.route(origin+'**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Roster proof</title>'}));await page.goto(origin);await page.addScriptTag({content:code});await page.addScriptTag({content:atomic});await page.evaluate(v=>new Promise((resolve,reject)=>{const r=indexedDB.open('hlm_front_office_v8',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,'db');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)}),original)}
async function backup(page){return page.evaluate(async()=>{const state=await HLMPhase11PlayableRosterProof.readSaved(indexedDB),payload=JSON.stringify(state),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)))].map(x=>x.toString(16).padStart(2,'0')).join('');return JSON.stringify({format:'hlm-phase11-verified-production-backup-v1',source:{database:'hlm_front_office_v8',store:'state',key:'db'},present:true,payload,sha256})})}
test('test-only authorized cutover makes imported player appear after reload; exact rollback restores roster and history',async({page})=>{
 await setup(page);const text=await backup(page);
 expect(await page.evaluate(u=>HLMPhase11PlayableRosterProof.materialize(u,{schema:7,settings:{controlledTeamId:42},customPlayers:[]}).controlledTeam.length,universe)).toBe(1);
 await page.evaluate(({candidate,text})=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).commit({candidate,backupText:text,authorization:'I AUTHORIZE PRODUCTION ROSTER IMPORT'}),{candidate,text});
 await page.reload();await page.addScriptTag({content:code});await page.addScriptTag({content:atomic});
 const players=await page.evaluate(async u=>HLMPhase11PlayableRosterProof.materialize(u,await HLMPhase11PlayableRosterProof.readSaved(indexedDB)).controlledTeam,universe);
 expect(players.map(p=>p.name)).toContain('Imported Rookie');expect(players).toHaveLength(2);
 await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB,{allowCutover:true}).rollback('I AUTHORIZE PRODUCTION ROLLBACK'));
 expect(await page.evaluate(async()=>HLMPhase11PlayableRosterProof.readSaved(indexedDB))).toEqual(original);
});
test('normal production activation disabled and duplicate base IDs rejected',async({page})=>{
 await setup(page);expect(await page.evaluate(()=>HLMPhase11PlayableRosterProof.activationEnabled)).toBe(false);
 const rejected=await page.evaluate(u=>{try{HLMPhase11PlayableRosterProof.materialize(u,{schema:7,settings:{controlledTeamId:42},customPlayers:[{id:100,teamId:42}]});return false}catch{return true}},universe);expect(rejected).toBe(true);
});
