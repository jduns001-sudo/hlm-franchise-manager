'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1524-gm-trade-review.html'),'utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  assert.match(await page.locator('body').innerText(),/Production trades and saves are disabled/);
  assert.equal(await page.locator('#submit').isDisabled(),true);
  await page.locator('#outgoing').fill('pA');await page.locator('#incoming').fill('pB');
  await page.locator('#review').click();
  assert.match(await page.locator('#status').innerText(),/No source-backed review host connected/);
  await page.evaluate(()=>{window.__requests=[];window.HLMTradeReviewHost={
   review:async request=>{window.__requests.push({kind:'review',...request});return {
    ok:true,revision:4,cpuDecision:'recommend-accept',financial:{eligible:true},
    restrictions:{eligible:true},cpuConsentAuthenticated:false,settlementAuthorized:false,saved:false}},
   settle:async request=>{window.__requests.push({kind:'settle',...request});return {
    saved:false,code:'cpu-consent-not-authenticated',settlementAuthorized:false}}
  }});
  await page.locator('#review').click();
  assert.equal(await page.locator('#submit').isDisabled(),true);
  await page.locator('#approve').check();
  assert.equal(await page.locator('#submit').isEnabled(),true);
  await page.locator('#submit').click();
  assert.match(await page.locator('#status').innerText(),/Settlement blocked/);
  const calls=await page.evaluate(()=>window.__requests);
  assert.equal(calls.length,2);assert.equal(calls[1].expectedGameRevision,4);assert.equal(calls[1].gmApproved,true);
  await page.locator('#review').click();await page.locator('#approve').check();
  await page.locator('#decline').click();
  assert.equal(await page.locator('#submit').isDisabled(),true);
  assert.equal((await page.evaluate(()=>window.__requests)).length,3);
  await page.locator('#outgoing').fill('pC');
  assert.equal(await page.locator('#submit').isDisabled(),true);
  await page.evaluate(()=>{window.HLMTradeReviewHost.review=async()=>({
   ok:true,revision:4,cpuConsentAuthenticated:true,settlementAuthorized:false,saved:false})});
  await page.locator('#review').click();
  assert.equal(await page.locator('#approve').isDisabled(),true,'forged CPU consent cannot enable approval');
  // A delayed host response must never revive approval after GM cancellation.
  let resolveDelayed;
  await page.evaluate(()=>{window.HLMTradeReviewHost.review=()=>new Promise(resolve=>{window.__resolveDelayedReview=resolve})});
  await page.locator('#review').click();
  await page.locator('#decline').click();
  await page.evaluate(()=>window.__resolveDelayedReview({ok:true,revision:5,cpuDecision:'accept',financial:{eligible:true},restrictions:{eligible:true},cpuConsentAuthenticated:false,settlementAuthorized:false,saved:false}));
  await page.locator('#review').waitFor({state:'visible'});
  assert.equal(await page.locator('#approve').isDisabled(),true,'late review cannot override decline');
  assert.equal(await page.locator('#submit').isDisabled(),true);
  assert.match(await page.locator('#status').innerText(),/Declined. No changes saved/);
  // Editing an input during a pending review must also invalidate the response.
  await page.locator('#review').click();
  await page.locator('#incoming').fill('pC');
  await page.evaluate(()=>window.__resolveDelayedReview({ok:true,revision:5,cpuDecision:'accept',financial:{eligible:true},restrictions:{eligible:true},cpuConsentAuthenticated:false,settlementAuthorized:false,saved:false}));
  assert.equal(await page.locator('#approve').isDisabled(),true,'late review cannot override changed proposal');
  assert.equal(await page.locator('#submit').isDisabled(),true);
  console.log('M1524 mobile review, default-off, explicit approval, decline no-save, input invalidation and forged-consent rejection passed');
  await page.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
