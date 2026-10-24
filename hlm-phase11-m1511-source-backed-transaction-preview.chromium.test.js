'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const source=fs.readFileSync('hlm-phase11-m1511-source-backed-transaction-preview.js','utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<pre id="source"></pre><script>document.querySelector("#source").textContent='+JSON.stringify(source)+';</script>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  const loaded=await page.locator('#source').textContent();
  assert.match(loaded,/evaluateTradeEligibility/);
  assert.match(loaded,/evaluateTradeRestrictions/);
  assert.match(loaded,/settlementAuthorized:false/);
  assert.doesNotMatch(loaded,/localStorage\.setItem|indexedDB\.open|\.approve\(/);
  await context.close();console.log('M1511 mobile browser read-only source module inspection passed');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
