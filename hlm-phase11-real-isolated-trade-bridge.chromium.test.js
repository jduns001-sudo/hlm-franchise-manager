'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {startServer}=require('./hlm-phase11-real-isolated-trade-bridge');
(async()=>{
 const server=await startServer(),browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(server.url);
  assert.equal(await page.locator('#approve').isDisabled(),true);
  await page.locator('#review').click();
  await page.getByText('Review ready. GM decision required; settlement disabled.').waitFor();
  assert.match(await page.locator('#summary').innerText(),/Alpha/);
  assert.match(await page.locator('#summary').innerText(),/Bravo/);
  assert.match(await page.locator('#summary').innerText(),/2028 round 1/);
  assert.match(await page.locator('#summary').innerText(),/Cap\/contracts: true/);
  await page.locator('#decline').click();
  await page.getByText(/Decision decline: decline/).waitFor();
  assert.equal(await page.locator('#approve').isDisabled(),true);
  await page.locator('#review').click();await page.getByText('Review ready. GM decision required; settlement disabled.').waitFor();
  await page.locator('#cancel').click();await page.getByText(/Decision cancel: cancel/).waitFor();
  await page.locator('#review').click();await page.getByText('Review ready. GM decision required; settlement disabled.').waitFor();
  await page.locator('#approve').click();await page.getByText(/settlement-disabled/).last().waitFor();
  await page.locator('#reload').click();await page.getByText('Review cleared. No save.').waitFor();
  assert.equal(await page.locator('#approve').isDisabled(),true);
  assert.equal(server.bridge.inspect().writes,0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),null);
  assert.equal(await page.evaluate(()=>localStorage.length),0);
  await page.reload();assert.equal(await page.locator('#approve').isDisabled(),true);
 }finally{await browser.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
