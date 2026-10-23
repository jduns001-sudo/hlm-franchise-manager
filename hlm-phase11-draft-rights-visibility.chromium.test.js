'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
  await page.route('**/hlm-phase11-isolated-single-game.html*',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.route('**/hlm-phase11-source-pick-transfer.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync('hlm-phase11-source-pick-transfer.js','utf8')}));
  await page.route('**/hlm-phase11-guarded-mobile-lifecycle.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync('hlm-phase11-guarded-mobile-lifecycle.js','utf8')}));
  await page.goto('https://jduns001-sudo.github.io/hlm-franchise-manager/hlm-phase11-isolated-single-game.html?mission1395='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','MISSION1395_PRODUCTION_SENTINEL'));
  await page.waitForFunction(()=>document.querySelector('#new-team')?.options.length===32&&!document.querySelector('#new-franchise')?.disabled,{timeout:60000});
  await page.locator('#new-team').selectOption('5');
  page.once('dialog',d=>d.accept());
  await page.locator('#new-franchise').click();
  await page.waitForFunction(()=>document.querySelector('#gm-roster')?.textContent.includes('Draft rights:'),{timeout:60000});
  assert.match(await page.locator('#gm-roster').innerText(),/Controlled team:.*Players: [1-9]/);
  assert.match(await page.locator('#gm-roster').innerText(),/Draft rights: 0/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1395_PRODUCTION_SENTINEL');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#gm-roster')?.textContent.includes('Draft rights:'),{timeout:60000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1395_PRODUCTION_SENTINEL');
  console.log('Mission 1395 mobile draft rights panel, reload and production isolation passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
