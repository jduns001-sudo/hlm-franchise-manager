'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
const {inspectCpuTradeLifecycle:nodeInspect}=require('./hlm-phase11-m1551-cpu-trade-decision-lifecycle');
(async()=>{
 const js=fs.readFileSync('hlm-phase11-m1551-browser-cpu-trade-lifecycle.js','utf8');
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><h1>CPU Trade Lifecycle</h1>')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.addScriptTag({content:js});
  for(const mode of ['agree','conflict','missing','stale','gm-cancel','stale-revision']){
   const state={meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}};
   const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
   if(mode==='conflict')state.extensions.cpuTradeDecisions[0].decision='decline';
   if(mode==='missing')delete state.extensions.cpuTradeDecisions;
   if(mode==='stale')state.extensions.cpuTradeDecisions[0].gameRevision=12;
   if(mode==='gm-cancel')input.gmApproved=false;
   if(mode==='stale-revision')input.expectedGameRevision=12;
   const expected=nodeInspect(state,input);
   const result=await page.evaluate(({state,input})=>{
    const before=JSON.stringify(state);
    localStorage.setItem('hlm-phase11-m1551-preserve','unchanged');
    const value=window.HLMPhase11CpuTradeLifecycle.inspect(state,input);
    return {value,unchanged:JSON.stringify(state)===before,storage:localStorage.getItem('hlm-phase11-m1551-preserve')};
   },{state,input});
   assert.deepEqual(result.value,expected,mode);
   assert.equal(result.unchanged,true);assert.equal(result.storage,'unchanged');
   assert.equal(result.value.saved,false);assert.equal(result.value.settlementAuthorized,false);
   assert.equal(result.value.consentAuthenticated,false);
  }
  console.log('M1551 mobile Chromium CPU lifecycle parity, stale/decline, read-only storage passed');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
