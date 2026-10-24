'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
const {reviewCpuTradeAuthorization:review}=require('./hlm-phase11-m1552-cpu-trade-authorization-review');
(async()=>{
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  for(const mode of ['agree','gm-cancel','stale','conflict','missing','overcap']){
   const state={meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}};
   const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
   if(mode==='gm-cancel')input.gmApproved=false;
   if(mode==='stale')input.expectedGameRevision=12;
   if(mode==='conflict')state.extensions.cpuTradeDecisions[0].decision='decline';
   if(mode==='missing')delete state.extensions.cpuTradeDecisions;
   if(mode==='overcap')state.finances.teamCapLimits.B=1;
   const before=JSON.stringify(state),expected=review({state,input,readCurrent:()=>state,storageKey:'hlm-m1552-isolated'});
   const result=await page.evaluate(({expected,before})=>{
    localStorage.setItem('hlm-m1552-isolated','preserve');
    return {expected,before,storage:localStorage.getItem('hlm-m1552-isolated')};
   },{expected,before});
   assert.equal(result.storage,'preserve');assert.equal(JSON.stringify(state),before);
   assert.equal(result.expected.saved,false);assert.equal(result.expected.settlementAuthorized,false);
   assert.equal(result.expected.consentAuthenticated,false);
  }
  console.log('M1552 mobile read-only cases and isolated storage preserved');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
