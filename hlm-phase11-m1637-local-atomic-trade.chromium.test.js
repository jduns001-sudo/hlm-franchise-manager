'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.route('https://mission1637.test/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Mission 1637 isolated fixture</title>'}));
  await page.goto('https://mission1637.test/');
  await page.evaluate(()=>{localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');localStorage.setItem('hlm_m1637_isolated','ISOLATED_SENTINEL')});
  const before=await page.evaluate(()=>({production:localStorage.getItem('hlm_front_office_v8'),isolated:localStorage.getItem('hlm_m1637_isolated')}));
  // Local D1 prototype is a Node-side test harness and is deliberately NOT
  // wired to this browser or any production endpoint.
  const {settle}=require('./hlm-phase11-m1637-local-atomic-trade');
  const mockDb={prepare(){throw Error('Browser must not invoke DB')},batch(){throw Error('Browser must not invoke DB')}};
  const outcome=await settle(mockDb,{localTestFixture:false,gmAction:'approve'});
  assert.equal(outcome.saved,false);assert.equal(outcome.settlementAuthorized,false);
  await page.reload();
  const after=await page.evaluate(()=>({production:localStorage.getItem('hlm_front_office_v8'),isolated:localStorage.getItem('hlm_m1637_isolated')}));
  assert.deepEqual(after,before);
  console.log('Mission 1637 mobile isolation PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
