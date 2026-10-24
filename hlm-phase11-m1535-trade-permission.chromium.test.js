'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1524-gm-trade-review.html'),'utf8');
 const bridge=fs.readFileSync(path.join(__dirname,'hlm-phase11-m1527-real-source-browser-review.js'),'utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.addScriptTag({content:bridge});
  assert.equal((await page.evaluate(()=>window.HLMRealSourceTradeReview.connect({}))).ok,false);
  await page.evaluate(async()=>{
   const name='hlm-m1535-permission-denied';
   const request=indexedDB.open(name,1);
   await new Promise((resolve,reject)=>{
    request.onupgradeneeded=()=>request.result.createObjectStore('records');
    request.onsuccess=resolve;request.onerror=()=>reject(request.error);
   });
   const db=request.result;
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readwrite'),s=tx.objectStore('records');
    s.put({meta:{revision:2,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}]},
      assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:2,tradePermission:'denied'},{playerId:'pB',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:5,B:5}},extensions:{tradeRosterLimits:{A:2,B:2}}},'game');
    s.put({revision:2,events:[]},'ledger');
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   });db.close();
  });
  assert.equal((await page.evaluate(()=>window.HLMRealSourceTradeReview.connect({experimentalEnabled:true,experimentalDatabaseName:'hlm-m1535-permission-denied'}))).ok,true);
  await page.locator('#outgoing').fill('pA');await page.locator('#incoming').fill('pB');
  await page.locator('#review').click();
  await page.locator('#summary').getByText(/source-restrictions-or-roster-limits-unverified/).waitFor();


  assert.equal(await page.locator('#approve').isDisabled(),false);
  await page.locator('#approve').check();
  await page.locator('#submit').click();
  await page.locator('#status').getByText(/Settlement blocked/).waitFor();
  assert.equal(await page.locator('#submit').isDisabled(),true);
  await page.locator('#review').click();await page.locator('#decline').click();
  assert.equal(await page.locator('#submit').isDisabled(),true);
  await page.locator('#outgoing').fill('unknown');await page.locator('#review').click();
  await page.locator('#summary').getByText(/source-ownership-or-contract-mismatch/).waitFor();
  console.log('M1535 denied trade permission fails closed without settlement and real IndexedDB mobile read-only source, default-off, invalid owner, blocked settlement and decline passed');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
