'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
const modules=['hlm-phase11-m1540-readonly-trade-plan','hlm-phase11-m1544-cpu-decision-authority','hlm-phase11-m1554-cpu-authorization-proposal-binding','hlm-phase11-m1555-engine-owned-cpu-decision','hlm-phase11-m1557-isolated-atomic-trade','hlm-phase11-m1558-atomic-settlement-boundary'];
const bundle='(function(root){const factories=Object.create(null),cache=Object.create(null);'+
 'function require(id){const key=id.replace(/^\\.\\//,\'\').replace(/\\.js$/,\'\');if(!factories[key])throw Error(\'Unknown module \'+key);if(!cache[key]){const module={exports:{}};cache[key]=module;factories[key](module,module.exports,require)}return cache[key].exports;}'+
 modules.map(name=>'factories['+JSON.stringify(name)+']=function(module,exports,require){\\n'+fs.readFileSync(name+'.js','utf8')+'\\n};').join('\\n').replaceAll('\\n','\n')+
 'root.HLMPhase11Settlement=Object.freeze(require(\'./hlm-phase11-m1558-atomic-settlement-boundary\'));})(globalThis);';
function fixture(){return {meta:{revision:19,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}}}
(async()=>{const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">')});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:'+server.address().port);await page.addScriptTag({content:bundle});
 for(const mode of ['missing-authorizer','forged-authorizer','cancel','stale','production-key']){
  const state=fixture(),input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:19};
  if(mode==='cancel')input.gmApproved=false;if(mode==='stale')input.expectedGameRevision=18;
  const result=await page.evaluate(({state,input,mode})=>{const before=JSON.stringify(state);localStorage.setItem('hlm_front_office_v8','production-unchanged');localStorage.setItem('hlm-m1558-isolated','preserved');let writes=0;const engine=window.HLMPhase11Settlement.createIsolatedTradeSettlementEngine({storageKey:mode==='production-key'?'hlm_front_office_v8':'hlm-m1558-isolated',readCurrent:()=>state,compareAndSwap:()=>{writes++;throw Error('unexpected write')},...(mode==='missing-authorizer'?{}:{authorizeCpu:()=>true})});const value=engine.requestSettlement({state,input:{...input,consentAuthenticated:true}});return {value,writes,unchanged:JSON.stringify(state)===before,production:localStorage.getItem('hlm_front_office_v8'),isolated:localStorage.getItem('hlm-m1558-isolated')};},{state,input,mode});
  const codes={'missing-authorizer':'independent-cpu-authorization-required','forged-authorizer':'trusted-cpu-authorizer-not-integrated',cancel:'human-gm-approval-required',stale:'stale-game-revision','production-key':'isolated-storage-required'};
  assert.equal(result.value.code,codes[mode],mode);assert.equal(result.value.saved,false,mode);assert.equal(result.value.settlementAuthorized,false,mode);assert.equal(result.writes,0,mode);assert.equal(result.unchanged,true,mode);assert.equal(result.production,'production-unchanged',mode);assert.equal(result.isolated,'preserved',mode);
 }
 console.log('M1558 mobile settlement boundary safety passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
