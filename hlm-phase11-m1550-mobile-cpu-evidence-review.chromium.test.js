'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const js=fs.readFileSync('hlm-phase11-m1550-browser-cpu-evidence-bridge.js','utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><h1>Isolated GM CPU evidence</h1>')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.addScriptTag({content:js});
  const result=await page.evaluate(()=>{
   const s={meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}};
   const before=JSON.stringify(s),key='hlm-phase11-m1550-untouched';
   localStorage.setItem(key,'preserve');
   const i={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
   const good=window.HLMPhase11CpuEvidenceBridge.review(s,i);
   s.extensions.cpuTradeDecisions[0].decision='decline';
   const conflict=window.HLMPhase11CpuEvidenceBridge.review(s,i);
   return {good:good.code,conflict:conflict.code,saved:good.saved,authorized:good.settlementAuthorized,consent:good.consentAuthenticated,unchangedAfterFirst:before!==JSON.stringify(s),storage:localStorage.getItem(key)};
  });
  assert.equal(result.good,'cpu-policy-evidence-agrees');
  assert.equal(result.conflict,'cpu-policy-evidence-conflict');
  assert.equal(result.saved,false);assert.equal(result.authorized,false);assert.equal(result.consent,false);
  assert.equal(result.storage,'preserve');
  console.log('M1550 mobile Chromium read-only CPU evidence agreement/conflict and storage isolation passed');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
