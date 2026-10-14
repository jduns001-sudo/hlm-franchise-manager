'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const html=fs.readFileSync('phase11-import-workbench.html','utf8');
const names=['hlm-phase11-import-workbench.js','hlm-phase11-cutover-integration.js','hlm-phase11-atomic-cutover.js','hlm-phase11-final-roster-gate.js','hlm-phase11-mobile-activation-safety.js'];
const code=Object.fromEntries(names.map(n=>[n,fs.readFileSync(n,'utf8')]));
test.use({browserName:'chromium',viewport:{width:390,height:844}});
test('mobile workbench activation preview defaults disabled and never writes to production',async({page})=>{
 await page.route('https://phase11-mobile-preview.invalid/**',r=>{const name=r.request().url().split('/').pop();return r.fulfill({status:200,contentType:code[name]?'text/javascript':'text/html',body:code[name]||html})});
 await page.goto('https://phase11-mobile-preview.invalid/phase11-import-workbench.html');
 await expect(page.locator('#phase11-activation-safety button')).toBeVisible();
 expect(await page.evaluate(()=>HLMPhase11MobileActivationSafety.productionEnabled)).toBe(false);
 await page.click('#phase11-activation-safety button');
 await expect(page.locator('#phase11-activation-safety [role=status]')).toContainText('Reopen the downloaded backup file first');
 expect(await page.evaluate(()=>HLMPhase11AtomicCutover.createController(indexedDB).enabled)).toBe(false);
 expect(await page.evaluate(()=>HLMPhase11ExplicitActivation===undefined).catch(()=>true)).toBe(true);
});
