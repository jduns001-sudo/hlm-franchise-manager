'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {inspectCpuTradeReview:inspect}=require('./hlm-phase11-m1643-cpu-trade-review-integration');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('data:text/html,<html><body><button id="approve">Approve</button><button id="decline">Decline</button><button id="cancel">Cancel</button></body></html>');
  const base={experimentalEnabled:true,slot:'s',revision:'r1',proposalDigest:'d',teamId:'BUF',humanGMApproved:true,now:100,consumedDecisionIds:[],cpuEvidence:{slot:'s',revision:'r1',proposalDigest:'d',teamId:'BUF',decision:'accept',decisionId:'id',issuer:'CPU-BUF',keyId:'key',signature:'ZmFrZQ==',issuedAt:90,expiresAt:110}};
  for(const action of ['approve','decline','cancel']){
   await page.locator('#'+action).click();
   const x=inspect({...base,gmAction:action});
   assert.equal(x.saved,false);assert.equal(x.settlementAuthorized,false);
   assert.equal(x.productionTouched,false);
  }
  assert.equal(inspect({...base,experimentalEnabled:false,gmAction:'approve'}).code,'disabled-by-default');
  console.log('Mission 1643 isolated mobile review integration PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
