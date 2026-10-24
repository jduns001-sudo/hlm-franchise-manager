'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const source=fs.readFileSync('hlm-phase11-m1512-transaction-preparation.js','utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<pre id="source"></pre><script>document.querySelector("#source").textContent='+JSON.stringify(source)+';</script>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  const loaded=await page.locator('#source').textContent();
  assert.match(loaded,/inspect\(state,input,options\)/);
  assert.match(loaded,/settlementAuthorized:false/);
  assert.doesNotMatch(loaded,/localStorage\.setItem|indexedDB\.open|\.approve\(/);
  await context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
