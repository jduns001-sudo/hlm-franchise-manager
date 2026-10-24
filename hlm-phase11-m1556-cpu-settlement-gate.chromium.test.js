'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
const modules=['hlm-phase11-m1540-readonly-trade-plan','hlm-phase11-m1541-atomic-trade-preview','hlm-phase11-m1542-atomic-trade-commit-guard','hlm-phase11-m1544-cpu-decision-authority','hlm-phase11-m1554-cpu-authorization-proposal-binding','hlm-phase11-m1555-engine-owned-cpu-decision','hlm-phase11-m1556-cpu-settlement-gate'];
const bundle='(function(root){const factories=Object.create(null),cache=Object.create(null);'+
 'function require(id){const key=id.replace(/^\\.\\//,\'\').replace(/\\.js$/,\'\');if(!factories[key])throw Error(\'Unknown module \'+key);if(!cache[key]){const module={exports:{}};cache[key]=module;factories[key](module,module.exports,require)}return cache[key].exports;}'+
 modules.map(name=>'factories['+JSON.stringify(name)+']=function(module,exports,require){\\n'+fs.readFileSync(name+'.js','utf8')+'\\n};').join('\\n').replaceAll('\\n','\n')+
 'root.HLMPhase11CpuSettlementGate=Object.freeze(require(\'./hlm-phase11-m1556-cpu-settlement-gate\'));})(globalThis);';
function fixture(){return {meta:{revision:19,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}}}
(async()=>{const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">')});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:'+server.address().port);await page.addScriptTag({content:bundle});
 for(const mode of ['accept','cancel','stale','decline','overcap','production-key','spoof']){
  const state=fixture(),input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:19};
  if(mode==='cancel')input.gmApproved=false;if(mode==='stale')input.expectedGameRevision=18;
  if(mode==='decline')state.assets.contracts[0].aav=4;
  if(mode==='overcap')state.finances.teamCapLimits.B=1;
  if(mode==='spoof'){input.cpuConsentApproved=true;input.consentAuthenticated=true;state.extensions.cpuTradeConsentEvidence=[{decision:'accept'}];}
  const result=await page.evaluate(({state,input,mode})=>{const before=JSON.stringify(state);localStorage.setItem('hlm_front_office_v8','production-unchanged');localStorage.setItem('hlm-m1556-isolated','preserved');let writes=0;const value=window.HLMPhase11CpuSettlementGate.requestCpuTradeSettlement({state,input,storageKey:mode==='production-key'?'hlm_front_office_v8':'hlm-m1556-isolated',readCurrent:()=>state,writeCurrent:()=>{writes++;throw Error('unexpected write')}});return {value,writes,unchanged:JSON.stringify(state)===before,production:localStorage.getItem('hlm_front_office_v8'),isolated:localStorage.getItem('hlm-m1556-isolated')};},{state,input,mode});
  assert.equal(result.value.ok,false,mode);assert.equal(result.value.saved,false,mode);assert.equal(result.value.settlementAuthorized,false,mode);assert.equal(result.value.consentAuthenticated,false,mode);assert.equal(result.writes,0,mode);assert.equal(result.unchanged,true,mode);assert.equal(result.production,'production-unchanged',mode);assert.equal(result.isolated,'preserved',mode);
  const codes={accept:'receiving-team-consent-not-authenticated',cancel:'human-gm-approval-required',stale:'stale-game-revision',decline:'cpu-policy-declined',overcap:'salary-cap-exceeded','production-key':'isolated-storage-required',spoof:'receiving-team-consent-not-authenticated'};assert.equal(result.value.code,codes[mode],mode);
 }
 console.log('M1556 mobile settlement gate safety and production isolation passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
