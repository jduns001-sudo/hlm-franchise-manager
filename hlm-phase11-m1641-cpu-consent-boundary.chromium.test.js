'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {inspectAuthenticatedCpuConsent:inspect}=require('./hlm-phase11-m1641-cpu-consent-boundary');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://example.test').catch(()=>{});
  await page.goto('data:text/html,<html><body><button id="approve">Approve</button><button id="decline">Decline</button></body></html>');
  // No production UI wiring: exercise mobile interaction and the boundary in isolation.
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL')).catch(()=>{});
  const fixture={slot:'s',revision:'r1',proposalDigest:'d',teamId:'BUF',decision:'accept',synthetic:true};
  await page.locator('#approve').click();
  assert.equal(inspect({slot:'s',revision:'r1',proposalDigest:'d',teamId:'BUF',gmAction:'approve',humanGMApproved:true,cpuEvidence:fixture}).saved,false);
  await page.locator('#decline').click();
  assert.equal(inspect({slot:'s',revision:'r1',proposalDigest:'d',teamId:'BUF',gmAction:'decline',humanGMApproved:true,cpuEvidence:fixture}).saved,false);
  assert.equal(inspect({slot:'s',revision:'r1',proposalDigest:'d',teamId:'BUF',gmAction:'approve',humanGMApproved:true,cpuEvidence:{...fixture,synthetic:false,authenticated:true}}).settlementAuthorized,false);
  console.log('Mission 1641 mobile fail-closed CPU boundary PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
