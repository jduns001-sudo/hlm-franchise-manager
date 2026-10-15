'use strict';
const {test,expect}=require('@playwright/test');
const origin='https://jduns001-sudo.github.io/hlm-franchise-manager/';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
async function readSaved(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const req=indexedDB.open('hlm_front_office_v8',1);
  req.onsuccess=()=>{const db=req.result,tx=db.transaction('state','readonly'),get=tx.objectStore('state').get('db');get.onsuccess=()=>{resolve(get.result);db.close()};get.onerror=()=>reject(get.error)};
  req.onerror=()=>reject(req.error);
 }));
}
async function importBackup(page,name,content){
 await page.locator('#nav button').filter({hasText:/^Import \/ Export$/}).first().click();
 const dialogPromise=page.waitForEvent('dialog',{timeout:15000});
 await page.locator('#view input[type=file]').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(content)});
 const dialog=await dialogPromise;
 const message=dialog.message();
 await dialog.accept();
 return message;
}
test('malformed and incompatible imports reject without replacing an isolated synthetic franchise save',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await ctx.newPage();
 try{
  const response=await page.goto(origin+'app.html',{waitUntil:'domcontentloaded',timeout:45000});
  expect(response?.status()).toBe(200);
  await expect(page.locator('#nav button').first()).toBeVisible({timeout:30000});
  expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  expect(await page.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('undefined');
  const synthetic=await page.evaluate(()=>{
   const st=compactState();
   return {...st,settings:{...st.settings,franchiseName:'Synthetic Import Safety 1035'},customPlayers:[...st.customPlayers,{id:9901035,name:'Synthetic Safety Prospect',age:19,teamId:db.teams[0].id,position:'C',positions:['C'],ovr:81,potential:90,potentialMin:85,potentialMax:95,type:'Playmaker',retired:false}]};
  });
  expect(await importBackup(page,'synthetic-valid.json',JSON.stringify(synthetic))).toBe('Backup restored.');
  await expect.poll(async()=>((await readSaved(page))?.settings?.franchiseName)).toBe('Synthetic Import Safety 1035');
  const before=await readSaved(page);
  expect(before.customPlayers.some(p=>p.id===9901035)).toBe(true);
  const malformed=await importBackup(page,'synthetic-malformed.json','{"schema":7,');
  expect(malformed).toMatch(/^Invalid backup file:/);
  expect(await readSaved(page)).toEqual(before);
  const incompatible=await importBackup(page,'synthetic-incompatible.json',JSON.stringify({schema:999,settings:null,customPlayers:'not-an-array'}));
  expect(incompatible).toMatch(/^Invalid backup file:/);
  expect(await readSaved(page)).toEqual(before);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#nav button').first()).toBeVisible({timeout:30000});
  expect(await page.evaluate(()=>db.settings.franchiseName)).toBe('Synthetic Import Safety 1035');
  expect(await page.evaluate(()=>db.players.some(p=>p.id===9901035))).toBe(true);
  expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  console.log('PASS: malformed and incompatible backups rejected, synthetic save unchanged before and after reload');
 }finally{await ctx.close()}
});

// Re-run against published Pages after Phase 11 backup validation deployment.
