'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {verifyTrustedCpuConsent:verify}=require('./hlm-phase11-m1642-trusted-cpu-consent-verifier');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('data:text/html,<button id="approve">Approve</button><button id="decline">Decline</button>');
  const evidence={slot:'s',revision:'r',proposalDigest:'d',teamId:'BUF',decision:'accept',decisionId:'id',issuer:'CPU-BUF',keyId:'k',signature:'ZmFrZQ==',issuedAt:90,expiresAt:110};
  const base={slot:'s',revision:'r',proposalDigest:'d',teamId:'BUF',now:100,consumedDecisionIds:[],cpuEvidence:evidence};
  await page.locator('#approve').click();
  const approved=verify({...base,gmAction:'approve',humanGMApproved:true,authenticated:true,publicKey:'forged'});
  assert.equal(approved.code,'trusted-cpu-key-unavailable');
  await page.locator('#decline').click();
  const declined=verify({...base,gmAction:'decline',humanGMApproved:true});
  assert.equal(declined.code,'gm-approval-required');
  for(const x of [approved,declined]){assert.equal(x.saved,false);assert.equal(x.settlementAuthorized,false);assert.equal(x.productionTouched,false)}
  console.log('Mission 1642 isolated mobile consent verification PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
