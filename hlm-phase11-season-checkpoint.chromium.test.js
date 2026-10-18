'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('file://'+path.resolve(__dirname,'hlm-phase11-season-checkpoint.html'));
  assert.match(await page.locator('h1').innerText(),/Season checkpoint/);
  assert.equal(await page.locator('#review').isVisible(),true);
  await page.locator('#review').click();
  assert.match(await page.locator('#report').innerText(),/No production save read or write/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  assert.equal(await page.locator('#report').getAttribute('aria-live'),'polite');
  const bridgePage=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await bridgePage.goto('file://'+path.resolve(__dirname,'hlm-phase11-gameplay-bridge.html'));
  assert.equal(await bridgePage.locator('#season-checkpoint-review').isVisible(),true);
  await bridgePage.locator('#season-checkpoint-review').click();
  assert.match(await bridgePage.locator('#season-checkpoint-output').innerText(),/Checkpoint unavailable: No isolated franchise loaded/);
  assert.equal(await bridgePage.locator('#season-checkpoint-output').getAttribute('aria-live'),'polite');
  console.log('Mission 1312 mobile Chromium accessibility and no-save-write empty state passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
