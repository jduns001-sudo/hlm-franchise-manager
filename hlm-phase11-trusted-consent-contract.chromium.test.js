'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<button id="review">Review receiving consent</button><output id="result"></output>');
  await page.evaluate(()=>document.querySelector('#review').addEventListener('click',()=>document.querySelector('#result').textContent='Preview only: no consent, no settlement, no save'));
  await page.locator('#review').tap();
  assert.match(await page.locator('#result').textContent(),/no settlement, no save/);
  console.log('Mission 1450 isolated mobile preview smoke passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
