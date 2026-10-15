'use strict';
const {test,expect}=require('@playwright/test');
const origin='https://jduns001-sudo.github.io/hlm-franchise-manager/app.html';
async function saved(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('hlm_front_office_v8',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const d=req.result,t=d.transaction('state','readonly'),g=t.objectStore('state').get('db');g.onsuccess=()=>{resolve(g.result);d.close()};g.onerror=()=>reject(g.error)}}))}
async function upload(page,name,content){await page.locator('#nav button').filter({hasText:/^Import \/ Export$/}).first().click();const dialog=page.waitForEvent('dialog');await page.locator('#view input[type=file]').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(content)});const d=await dialog;const msg=d.message();await d.accept();return msg}
test('two isolated mobile tabs preserve synthetic franchise after rejected imports',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const a=await ctx.newPage(),b=await ctx.newPage();
 try{
  for(const p of [a,b]){expect((await p.goto(origin,{waitUntil:'domcontentloaded'})).status()).toBe(200);await expect(p.locator('#nav button').first()).toBeVisible();expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);expect(await p.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('undefined')}
  const synthetic=await a.evaluate(()=>{const s=compactState();return {...s,settings:{...s.settings,franchiseName:'Synthetic Two Tab 1038'}}});
  expect(await upload(a,'synthetic-1038.json',JSON.stringify(synthetic))).toBe('Backup restored.');
  await expect.poll(async()=>((await saved(b))?.settings?.franchiseName)).toBe('Synthetic Two Tab 1038');
  const before=await saved(b);expect(before).toEqual(await saved(a));
  expect(await upload(a,'malformed-1038.json','{"schema":')).toMatch(/^Invalid backup file:/);
  expect(await saved(a)).toEqual(before);expect(await saved(b)).toEqual(before);
  expect(await upload(b,'incompatible-1038.json',JSON.stringify({schema:999,settings:null,customPlayers:'wrong'}))).toMatch(/^Invalid backup file:/);
  expect(await saved(a)).toEqual(before);expect(await saved(b)).toEqual(before);
  await Promise.all([a.reload({waitUntil:'domcontentloaded'}),b.reload({waitUntil:'domcontentloaded'})]);
  for(const p of [a,b]){await expect(p.locator('#nav button').first()).toBeVisible();expect(await saved(p)).toEqual(before);expect(await p.evaluate(()=>db.settings.franchiseName)).toBe('Synthetic Two Tab 1038');expect(await p.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false)}
  console.log('PASS: both isolated tabs retain synthetic save after malformed and incompatible rejection and reload');
 }finally{await ctx.close()}
});
