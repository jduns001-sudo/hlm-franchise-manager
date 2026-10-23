'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.route('https://mission1454.test/**', route => route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated Mission 1454 Test</title>'}));
  await page.goto('https://mission1454.test/');
  await page.evaluate(()=>{
   localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');
   localStorage.setItem('hlm_m1454_isolated','ISOLATED_SENTINEL');
  });
  const before=await page.evaluate(()=>({
   production:localStorage.getItem('hlm_front_office_v8'),
   isolated:localStorage.getItem('hlm_m1454_isolated')
  }));
  const {assess}=require('./hlm-phase11-trusted-cpu-consent-authority');
  const outcome=assess(null,null,'rev',null,{enabled:true});
  assert.equal(outcome.settlementAuthorized,false);
  assert.equal(outcome.saved,false);
  await page.reload();
  const after=await page.evaluate(()=>({
   production:localStorage.getItem('hlm_front_office_v8'),
   isolated:localStorage.getItem('hlm_m1454_isolated')
  }));
  assert.deepEqual(after,before);
  console.log('Mission 1454 mobile isolated no-write smoke passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
