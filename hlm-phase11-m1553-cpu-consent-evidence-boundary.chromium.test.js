'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright');
const {inspectCpuConsentEvidence:nodeInspect}=require('./hlm-phase11-m1553-cpu-consent-evidence-boundary');
const modules=['hlm-phase11-m1540-readonly-trade-plan','hlm-phase11-m1553-cpu-consent-evidence-boundary'];
const bundle='(function(root){const factories=Object.create(null),cache=Object.create(null);'+
 'function require(id){const key=id.replace(/^\\.\\//,\'\').replace(/\\.js$/,\'\');if(!factories[key])throw Error(\'Unknown module \'+key);if(!cache[key]){const module={exports:{}};cache[key]=module;factories[key](module,module.exports,require)}return cache[key].exports;}'+
 modules.map(name=>'factories['+JSON.stringify(name)+']=function(module,exports,require){\\n'+fs.readFileSync(name+'.js','utf8')+'\\n};').join('\\n').replaceAll('\\n','\n')+
 'root.HLMPhase11CpuConsentEvidence=Object.freeze({inspect:require(\'./hlm-phase11-m1553-cpu-consent-evidence-boundary\').inspectCpuConsentEvidence});})(globalThis);';
function fixture(){return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeConsentEvidence:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}}}
(async()=>{const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">')});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:'+server.address().port);await page.addScriptTag({content:bundle});
 for(const mode of ['matching','gm-cancel','stale','missing','duplicate','declined','mismatch','overcap','caller-impersonation']){
  const state=fixture(),input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
  if(mode==='gm-cancel')input.gmApproved=false;if(mode==='stale')input.expectedGameRevision=12;
  if(mode==='missing')delete state.extensions.cpuTradeConsentEvidence;
  if(mode==='duplicate')state.extensions.cpuTradeConsentEvidence.push({...state.extensions.cpuTradeConsentEvidence[0]});
  if(mode==='declined')state.extensions.cpuTradeConsentEvidence[0].decision='decline';
  if(mode==='mismatch')state.extensions.cpuTradeConsentEvidence[0].receivingTeamId='C';
  if(mode==='overcap')state.finances.teamCapLimits.B=1;
  if(mode==='caller-impersonation'){input.consentAuthenticated=true;input.cpuConsentApproved=true;}
  const expected=nodeInspect(state,input);
  const result=await page.evaluate(({state,input})=>{const before=JSON.stringify(state);localStorage.setItem('hlm_front_office_v8','untouched');localStorage.setItem('hlm-m1553-isolated','preserved');const value=window.HLMPhase11CpuConsentEvidence.inspect(state,input);return {value,unchanged:JSON.stringify(state)===before,production:localStorage.getItem('hlm_front_office_v8'),isolated:localStorage.getItem('hlm-m1553-isolated')};},{state,input});
  assert.deepEqual(result.value,expected,mode);assert.equal(result.unchanged,true,mode);assert.equal(result.production,'untouched',mode);assert.equal(result.isolated,'preserved',mode);assert.equal(result.value.saved,false,mode);assert.equal(result.value.consentAuthenticated,false,mode);assert.equal(result.value.settlementAuthorized,false,mode);
 }
 console.log('M1553 mobile browser-executed consent boundary parity and isolation passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
