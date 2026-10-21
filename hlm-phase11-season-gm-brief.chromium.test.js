'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.goto('file://'+path.resolve(__dirname,'hlm-phase11-gameplay-bridge.html'));
 assert.equal(await page.locator('#season-gm-brief-review').isVisible(),true);
 await page.locator('#season-gm-brief-review').click();
 assert.match(await page.locator('#season-gm-brief-output').innerText(),/Brief unavailable: No isolated franchise loaded/);
 assert.equal(await page.locator('#season-gm-brief-output').getAttribute('aria-live'),'polite');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 assert.equal(await page.locator('#season-gm-brief-review').evaluate(el=>el.getBoundingClientRect().height>=44),true);
 console.log('Mission 1313 mobile Chromium brief accessibility passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
