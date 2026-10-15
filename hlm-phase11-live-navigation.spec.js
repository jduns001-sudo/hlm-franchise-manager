'use strict';
const {test,expect}=require('@playwright/test');
const origin='https://jduns001-sudo.github.io/hlm-franchise-manager/';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
test('published Front Office read-only navigation renders key franchise screens on isolated mobile',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();
 try{
  const response=await page.goto(origin+'app.html',{waitUntil:'domcontentloaded',timeout:45000});
  expect(response?.status()).toBe(200);
  await expect(page.locator('#nav button').first()).toBeVisible({timeout:30000});
  expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  expect(await page.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('undefined');
  const sections=[
   {label:'Roster',heading:'Roster'},
   {label:'Lines',heading:'Lines'},
   {label:'Depth Chart',heading:'Depth Chart'},
   {label:'Contracts',heading:'Contracts'},
   {label:'Prospects',heading:'Prospects'},
   {label:'Draft Picks',heading:'Draft Picks'},
   {label:'Teams',heading:'Teams'},
   {label:'Free Agents',heading:'Free Agents'}
  ];
  for(const item of sections){
   const nav=page.locator('#nav button',{hasText:item.label}).filter({hasText:new RegExp('^'+item.label+'$')}).first();
   await expect(nav).toBeVisible();
   // Navigation only; never click action buttons within a view.
   await nav.click();
   await expect(page.locator('#title')).toContainText(item.heading);
   await expect(page.locator('#view')).not.toBeEmpty();
   expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  }
  console.log('PASS: eight live mobile read-only navigation screens rendered with Phase 11 disabled');
 }finally{await context.close()}
});
