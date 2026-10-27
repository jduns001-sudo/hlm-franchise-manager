'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const script=fs.readFileSync('hlm-phase11-m1627-cpu-consent-boundary.js','utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><h1>Experimental CPU decision review</h1><button id="review">Review</button><button id="decline">Decline</button><output id="result"></output>')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('http://127.0.0.1:'+server.address().port);await page.addScriptTag({content:script});
  const setup=()=>page.evaluate(()=>{
   const s={meta:{revision:17,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},extensions:{cpuTradeDecisions:[{proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:17,decision:'accept'}]}};
   const input={proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:17};
   localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');
   localStorage.setItem('hlm-m1627-isolated',JSON.stringify(s));
   const original=localStorage.getItem('hlm-m1627-isolated');
   window.reviewed=null;
   document.getElementById('review').onclick=()=>{window.reviewed=window.HLMM1627CpuConsentBoundary.inspect(JSON.parse(localStorage.getItem('hlm-m1627-isolated')),input);document.getElementById('result').textContent=window.reviewed.code};
   document.getElementById('decline').onclick=()=>{window.reviewed=null;document.getElementById('result').textContent='declined'};
   window.m1627={input,original};
  });
  await setup();await page.locator('#review').click();assert.equal(await page.locator('#result').textContent(),'source-cpu-decision-bound-read-only');
  assert.deepEqual(await page.evaluate(()=>({saved:window.reviewed.saved,authenticated:window.reviewed.consentAuthenticated,settlement:window.reviewed.settlementAuthorized})),{saved:false,authenticated:false,settlement:false});
  await page.locator('#decline').click();assert.equal(await page.locator('#result').textContent(),'declined');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm-m1627-isolated')===window.m1627.original),true);
  const stale=await context.newPage();await stale.goto('http://127.0.0.1:'+server.address().port);await stale.addScriptTag({content:script});
  const rejection=await stale.evaluate(()=>{const s=JSON.parse(localStorage.getItem('hlm-m1627-isolated'));s.meta.revision=18;const i={proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:17};return window.HLMM1627CpuConsentBoundary.inspect(s,i)});
  assert.equal(rejection.code,'stale-game-revision');
  await page.reload();await page.addScriptTag({content:script});assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm-m1627-isolated')===JSON.stringify(JSON.parse(localStorage.getItem('hlm-m1627-isolated')))),true);
  console.log('Mission 1627 mobile Chromium read-only review, decline no-save, stale-tab rejection, reload and production isolation PASS');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
