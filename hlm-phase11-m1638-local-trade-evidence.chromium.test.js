'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const evidence=require('./hlm-phase11-m1638-local-trade-evidence');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.route('https://mission1638.test/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Local test-only fixture</title>'}));
  await page.goto('https://mission1638.test/');
  await page.evaluate(()=>{localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');localStorage.setItem('hlm_m1638_isolated','ISOLATED_SENTINEL')});
  const before=await page.evaluate(()=>({production:localStorage.getItem('hlm_front_office_v8'),isolated:localStorage.getItem('hlm_m1638_isolated')}));
  const forbidden={prepare(){throw Error('Browser must not access D1')},batch(){throw Error('Browser must not access D1')}};
  const denied=await evidence.settle(forbidden,{localTestFixture:false,gmAction:'approve'});
  assert.equal(denied.saved,false);assert.equal(denied.settlementAuthorized,false);
  await page.reload();
  const after=await page.evaluate(()=>({production:localStorage.getItem('hlm_front_office_v8'),isolated:localStorage.getItem('hlm_m1638_isolated')}));
  assert.deepEqual(after,before);
  console.log('Mission 1638 mobile browser isolation PASS (not D1/browser integration)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
