'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const path=require('node:path');
const root=process.cwd(),html=fs.readFileSync(path.join(root,'app.html'),'utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844},serviceWorkers:'block'});
test('real app.html renders on mobile without enabling Phase 11 production cutover',async({page})=>{
 await page.route('https://phase11-real-app.invalid/**',async route=>{
  const pathname=new URL(route.request().url()).pathname;
  const relative=decodeURIComponent(pathname.slice(1)||'app.html');
  if(relative.includes('..'))return route.abort();
  const file=path.join(root,relative);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
  const type=relative.endsWith('.js')?'application/javascript':relative.endsWith('.css')?'text/css':relative.endsWith('.json')?'application/json':'text/html';
  return route.fulfill({status:200,contentType:type,body:fs.readFileSync(file)});
 });
 await page.goto('https://phase11-real-app.invalid/app.html',{waitUntil:'domcontentloaded'});
 await expect(page.locator('body')).toBeVisible();
 expect((await page.locator('body').innerText()).trim().length).toBeGreaterThan(20);
 expect(await page.evaluate(()=>typeof window.HLMPhase11AtomicCutover)).toBe('undefined');
 expect(await page.evaluate(()=>typeof window.HLMPhase11MobileOptInPreview)).toBe('undefined');
 expect(html).not.toContain('hlm-phase11-mobile-readiness-screen.html');
 expect(html).not.toContain('hlm-phase11-mobile-optin-preview.js');
});
test('real app.html has no automatic production cutover or recovery invocation',async()=>{
 expect(html).not.toContain('HLMPhase11AtomicCutover.createController');
 expect(html).not.toContain('I AUTHORIZE PRODUCTION ROSTER IMPORT');
 expect(html).not.toContain('HLMPhase11MobileOptInPreview.preview');
 expect(fs.readFileSync('hlm-phase11-cutover-integration.js','utf8')).toContain('productionCutoverEnabled:false');
});
test('existing cross-tab and interrupted-recovery suites are present on main',async()=>{
 for(const file of ['hlm-phase11-recovery-concurrency-audit.spec.js','hlm-phase11-reopened-backup-audit.spec.js','hlm-phase11-mobile-readiness-screen.spec.js'])expect(fs.existsSync(file),file).toBe(true);
});
