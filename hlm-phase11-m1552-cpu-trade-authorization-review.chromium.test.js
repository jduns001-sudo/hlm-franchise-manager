'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
const {reviewCpuTradeAuthorization:nodeReview}=require('./hlm-phase11-m1552-cpu-trade-authorization-review');
const modules=['hlm-phase11-m1540-readonly-trade-plan','hlm-phase11-m1541-atomic-trade-preview','hlm-phase11-m1542-atomic-trade-commit-guard','hlm-phase11-m1543-cpu-decision-evidence','hlm-phase11-m1544-cpu-decision-authority','hlm-phase11-m1549-cpu-trade-evidence-bridge','hlm-phase11-m1551-cpu-trade-decision-lifecycle','hlm-phase11-m1552-cpu-trade-authorization-review'];
const bundle='(function(root){const factories=Object.create(null),cache=Object.create(null);'+
 'function require(id){const key=id.replace(/^\\.\\//,\'\').replace(/\\.js$/,\'\');if(!factories[key])throw Error(\'Unknown module \'+key);if(!cache[key]){const module={exports:{}};cache[key]=module;factories[key](module,module.exports,require)}return cache[key].exports;}'+
 modules.map(name=>'factories['+JSON.stringify(name)+']=function(module,exports,require){\\n'+fs.readFileSync(name+'.js','utf8')+'\\n};').join('\\n').replaceAll('\\n','\n')+
 'root.HLMPhase11CpuTradeAuthorization=Object.freeze({review:require(\'./hlm-phase11-m1552-cpu-trade-authorization-review\').reviewCpuTradeAuthorization});})(globalThis);';
function fixture(){return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}}}
(async()=>{
 const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.addScriptTag({content:bundle});
  for(const mode of ['agree','gm-cancel','stale','conflict','missing','overcap','restricted','stale-persisted','production-key']){
   const state=fixture(),input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
   if(mode==='gm-cancel')input.gmApproved=false;
   if(mode==='stale')input.expectedGameRevision=12;
   if(mode==='conflict')state.extensions.cpuTradeDecisions[0].decision='decline';
   if(mode==='missing')delete state.extensions.cpuTradeDecisions;
   if(mode==='overcap')state.finances.teamCapLimits.B=1;
   if(mode==='restricted')state.assets.contracts[0].tradePermission='denied';
   const storageKey=mode==='production-key'?'hlm_front_office_v8':'hlm-m1552-isolated';
   const snapshot=mode==='stale-persisted'?{...state,meta:{...state.meta,revision:14}}:state;
   const expected=nodeReview({state,input,readCurrent:()=>snapshot,storageKey});
   const result=await page.evaluate(({state,input,snapshot,storageKey})=>{
    const before=JSON.stringify(state);
    localStorage.setItem('hlm-m1552-preserve','unchanged');
    localStorage.setItem('hlm_front_office_v8','production-unchanged');
    let writes=0;
    const value=window.HLMPhase11CpuTradeAuthorization.review({state,input,readCurrent:()=>snapshot,writeCurrent:()=>{writes++;},storageKey});
    return {value,unchanged:JSON.stringify(state)===before,writes,storage:localStorage.getItem('hlm-m1552-preserve'),production:localStorage.getItem('hlm_front_office_v8')};
   },{state,input,snapshot,storageKey});
   assert.deepEqual(result.value,expected,mode);
   assert.equal(result.unchanged,true,mode);assert.equal(result.writes,0,mode);
   assert.equal(result.storage,'unchanged',mode);assert.equal(result.production,'production-unchanged',mode);
   assert.equal(result.value.saved,false,mode);assert.equal(result.value.settlementAuthorized,false,mode);
   assert.equal(result.value.consentAuthenticated,false,mode);
  }
  console.log('M1552 mobile Chromium browser-executed source parity, stale/GM/consent and production isolation passed');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
