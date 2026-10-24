'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1508-browser-ledger.js'),'utf8');
 const server=http.createServer((req,res)=>{
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<!doctype html><meta name="viewport" content="width=device-width"><script>'+source+'</script>');
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();
  await Promise.all([a.goto(url),b.goto(url)]);
  const db='hlm-phase11-experiment-m1508-ci-'+process.pid;
  const fp='a'.repeat(64),next={schema:'hlm-m1507y-replay-ledger-v1',revision:1,consumed:{[fp]:true}};
  const initial=await a.evaluate(db=>HLMPhase11M1508Ledger.read(db),db);
  assert.equal(initial.revision,0);
  const results=await Promise.all([a.evaluate(([n,l,f])=>HLMPhase11M1508Ledger.compareAndSwap({expectedRevision:0,nextLedger:l,fingerprint:f},n),[db,next,fp]),
    b.evaluate(([n,l,f])=>HLMPhase11M1508Ledger.compareAndSwap({expectedRevision:0,nextLedger:l,fingerprint:f},n),[db,next,fp])]);
  assert.equal(results.filter(r=>r.committed).length,1);
  await a.reload();
  const persisted=await a.evaluate(db=>HLMPhase11M1508Ledger.read(db),db);
  assert.equal(persisted.revision,1);assert.equal(persisted.consumed[fp],true);
  const replay=await b.evaluate(([n,l,f])=>HLMPhase11M1508Ledger.compareAndSwap({expectedRevision:0,nextLedger:l,fingerprint:f},n),[db,next,fp]);
  assert.equal(replay.committed,false);
  const declined=await a.evaluate(db=>HLMPhase11M1508Ledger.read(db),db);
  assert.deepEqual(declined,persisted);
  await context.close();
  console.log('Mission 1508 browser: concurrent CAS, reload, replay and no-save passed');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
