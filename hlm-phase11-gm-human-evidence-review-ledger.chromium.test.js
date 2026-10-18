'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('file://'+require('node:path').resolve('hlm-phase11-gm-human-evidence-review-ledger.js'));
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><main><h1>Human GM evidence review</h1><p id="status">Pending independent verification</p></main>');
  await page.addScriptTag({path:require('node:path').resolve('hlm-phase11-gm-human-evidence-review-ledger.js')});
  const result=await page.evaluate(()=>globalThis.HLMGMHumanEvidenceReviewLedger.build({kind:'experimental-gm-human-session-handoff-packets',packets:[{checks:[{taskId:'a',sourceRequirement:'verify',remainingGap:'missing'}]}]},[],true));
  assert.equal(result.productionActivationAllowed,false);
  assert.equal(result.entries[0].eligibility,'unknown');
  assert.equal(await page.locator('#status').innerText(),'Pending independent verification');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  console.log('Mission 1274 mobile Chromium passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});