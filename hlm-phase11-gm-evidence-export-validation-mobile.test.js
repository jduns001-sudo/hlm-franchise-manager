'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve(__dirname,'hlm-phase11-gm-evidence-export-validation-preview.html'));
 await page.locator('#validate').click();
 assert.match(await page.locator('#result').innerText(),/Example valid/);
 await page.locator('#data').fill('{"productionActivationEnabled":true}');
 await page.locator('#validate').click();
 assert.match(await page.locator('#result').innerText(),/Example invalid/);
 assert.match(await page.locator('#result').innerText(),/No save writes/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 console.log('GM evidence validation mobile Chromium passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
