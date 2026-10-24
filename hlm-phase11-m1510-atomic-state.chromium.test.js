'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const src=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1510-atomic-state.js'),'utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<script>'+src+'</script>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();
  const url='http://127.0.0.1:'+server.address().port;
  await Promise.all([a.goto(url),b.goto(url)]);
  const name='hlm-m1510-test-'+process.pid,fp='a'.repeat(64);
  const input={experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
   expectedLedgerRevision:0,expectedGameRevision:0,fingerprint:fp,eventId:'synthetic-one'};
  const initial=await a.evaluate(name=>HLMPhase11M1510AtomicState.read(name),name);
  assert.equal(initial.ledger.revision,0);assert.equal(initial.game.revision,0);
  const denied=await a.evaluate(([input,name])=>HLMPhase11M1510AtomicState.commit({...input,cancelled:true},name),[input,name]);
  assert.equal(denied.committed,false);
  const race=await Promise.all([a.evaluate(([i,n])=>HLMPhase11M1510AtomicState.commit(i,n),[input,name]),
   b.evaluate(([i,n])=>HLMPhase11M1510AtomicState.commit(i,n),[input,name])]);
  assert.equal(race.filter(x=>x.committed).length,1);
  await a.reload();
  const persisted=await a.evaluate(name=>HLMPhase11M1510AtomicState.read(name),name);
  assert.equal(persisted.ledger.revision,1);assert.equal(persisted.game.revision,1);
  assert.equal(persisted.ledger.consumed[fp],true);
  assert.deepEqual(persisted.game.events,[{id:'synthetic-one',fingerprint:fp}]);
  const replay=await b.evaluate(([i,n])=>HLMPhase11M1510AtomicState.commit(i,n),[input,name]);
  assert.equal(replay.committed,false);
  const staleGame=await b.evaluate(([i,n])=>HLMPhase11M1510AtomicState.commit({...i,expectedLedgerRevision:1,fingerprint:'b'.repeat(64),eventId:'synthetic-two'},n),[input,name]);
  assert.equal(staleGame.committed,false);
  const unchanged=await a.evaluate(name=>HLMPhase11M1510AtomicState.read(name),name);
  assert.deepEqual(unchanged,persisted);
  await context.close();console.log('M1510 isolated atomic ledger + game record, replay, reload, cancellation passed');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
