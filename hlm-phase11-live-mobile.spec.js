'use strict';
const {test,expect}=require('@playwright/test');
const origin='https://jduns001-sudo.github.io/hlm-franchise-manager/';
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
test('live Pages Front Office opens on isolated mobile Chromium with cutover disabled',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await ctx.newPage();
 try{
  // Brand-new temporary browser context: no user cookies, localStorage or IndexedDB.
  const response=await page.goto(origin+'app.html',{waitUntil:'domcontentloaded',timeout:45000});
  expect(response?.status()).toBe(200);
  await expect(page.locator('#title')).toContainText('Command Center',{timeout:30000});
  await expect(page.locator('body')).toContainText('Front Office');
  expect(await page.evaluate(()=>window.HLM_PHASE11_SAVE_GUARD_OPT_IN===true)).toBe(false);
  expect(await page.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('undefined');
  // Navigation presence only: do not click write-capable controls or touch saves.
  expect(await page.locator('nav,aside,[class*=nav],[id*=nav]').count()).toBeGreaterThan(0);
  const scripts=await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));
  expect(scripts.some(src=>src&&src.includes('hlm-phase11-atomic-cutover.js'))).toBe(false);
  console.log('PASS: live app.html 200, mobile Command Center visible, navigation present, Phase 11 guard and cutover disabled');
 }finally{await ctx.close()}
});
