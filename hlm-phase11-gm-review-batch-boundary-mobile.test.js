'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve(__dirname,'hlm-phase11-gm-review-batch-boundary-preview.html'));
 assert.equal(await page.locator('#result').getAttribute('role'),'status');
 await page.locator('#check').focus();await page.keyboard.press('Enter');
 assert.match(await page.locator('#result').innerText(),/human GM review/);
 assert.match(await page.locator('#result').innerText(),/No gameplay action authorized/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 console.log('GM review batch boundary mobile Chromium passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
