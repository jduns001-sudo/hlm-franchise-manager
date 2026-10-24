'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),http=require('node:http');
(async()=>{
 const src=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1508-browser-ledger.js'),'utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<script>'+src+'</script>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const ctx=await browser.newContext(),page=await ctx.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  const name='hlm-m1509-test-'+process.pid,a='a'.repeat(64),b='b'.repeat(64);
  const apply=(expectedRevision,consumed,fingerprint)=>page.evaluate(
   ([name,expectedRevision,consumed,fingerprint])=>HLMPhase11M1508Ledger.compareAndSwap({
    expectedRevision,nextLedger:{schema:'hlm-m1507y-replay-ledger-v1',revision:expectedRevision+1,consumed},fingerprint},name),
   [name,expectedRevision,consumed,fingerprint]);
  assert.equal((await apply(0,{[a]:true},a)).committed,true);
  // A crafted transition cannot replace or erase an earlier consumed nonce.
  assert.equal((await apply(1,{[b]:true},b)).committed,false);
  assert.equal((await apply(1,{[a]:true,[b]:true},b)).committed,true);
  assert.equal((await apply(2,{[b]:true,[a]:true},a)).committed,false);
  assert.equal((await apply(2,{[a]:true,[b]:true},b)).committed,false);
  assert.equal((await apply(2,{[a]:true,[b]:true,['c'.repeat(64)]:false},'c'.repeat(64))).committed,false);
  await page.reload();
  const stored=await page.evaluate(name=>HLMPhase11M1508Ledger.read(name),name);
  assert.equal(stored.revision,2);assert.equal(stored.consumed[a],true);assert.equal(stored.consumed[b],true);
  assert.equal(Object.keys(stored.consumed).length,2);
  await ctx.close();console.log('M1509 append-only authorization history and reload verified');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
