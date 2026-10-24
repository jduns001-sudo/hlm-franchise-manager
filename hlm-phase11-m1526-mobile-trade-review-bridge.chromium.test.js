'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1524-gm-trade-review.html'),'utf8');
 const bridge=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1526-mobile-trade-review-bridge.js'),'utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.addScriptTag({content:bridge});
  await page.locator('#outgoing').fill('pA');await page.locator('#incoming').fill('pB');
  await page.locator('#review').click();
  assert.match(await page.locator('#status').innerText(),/No source-backed review host connected/);
  const disabled=await page.evaluate(()=>window.HLMTradeReviewBridge.connect(()=>({review:async()=>({ok:true})}),{}));
  assert.equal(disabled.connected,false);
  const connected=await page.evaluate(()=>window.HLMTradeReviewBridge.connect(()=>({
   review:async()=>({ok:true,revision:2,cpuDecision:'policy-accept',
    financial:{eligible:true,sourceValidated:true},restrictions:{eligible:true,sourceValidated:true},
    cpuConsentAuthenticated:false,settlementAuthorized:false,saved:false})
  }),{experimentalEnabled:true,experimentalDatabaseName:'hlm-m1526-test'}));
  assert.equal(connected.connected,true);
  await page.locator('#review').click();
  assert.match(await page.locator('#summary').innerText(),/sourceValidated/);
  await page.locator('#approve').check();await page.locator('#submit').click();
  assert.match(await page.locator('#status').innerText(),/Settlement blocked/);
  await page.locator('#review').click();await page.locator('#approve').check();
  await page.locator('#decline').click();
  assert.equal(await page.locator('#submit').isDisabled(),true);
  console.log('M1526 mobile host bridge default-off, reviewed source fields, blocked settlement and decline no-save passed');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
