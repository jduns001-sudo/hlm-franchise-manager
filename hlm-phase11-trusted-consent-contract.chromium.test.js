'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const {chromium}=require('playwright');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {contract,check}=require('./hlm-phase11-trusted-consent-contract');
const input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
function fixture(){
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
 s.history.seasons=[{year:2034,champion:1}];return s;
}
(async()=>{
 const state=fixture(),before=JSON.stringify(state),expected=contract(state,input,'revision-1');
 const receipt={nonce:'nonce-1',revision:expected.revision,digest:expected.digest,receivingTeamId:expected.proposal.receivingTeamId};
 const scenarios={
  forged:{...receipt,digest:'forged'},
  stale:{...receipt,revision:'revision-0'},
  replay:receipt,
  cancelled:receipt,
  spoofed:receipt
 };
 const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<meta name="viewport" content="width=device-width, initial-scale=1"><button id="forged">Forged</button><button id="stale">Stale</button><button id="replay">Replay</button><button id="cancelled">Cancel</button><button id="spoofed">Spoofed</button><output id="result"></output><script>for(const button of document.querySelectorAll("button"))button.onclick=async()=>{const r=await fetch("/check?case="+button.id);document.querySelector("#result").textContent=JSON.stringify(await r.json())}</script>');return}
  const key=new URL(req.url,'http://localhost').searchParams.get('case');
  if(!Object.hasOwn(scenarios,key)){res.writeHead(404);res.end();return}
  const result=check(state,input,'revision-1',scenarios[key],{trustedIntegration:true,verify:()=>true},{has:()=>key==='replay'},{cancelled:key==='cancelled'});
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  for(const key of Object.keys(scenarios)){
   await page.locator('#'+key).tap();
   await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector('#result').textContent).status==='consent-blocked'}catch{return false}});
   const result=JSON.parse(await page.locator('#result').textContent());
   assert.equal(result.independentlyAuthenticated,false,key);
   assert.equal(result.settlementAuthorized,false,key);
   assert.equal(result.saved,false,key);
   assert.equal(result.experimental,true,key);
   await page.locator('#result').evaluate(el=>el.textContent='');
  }
  assert.equal(JSON.stringify(state),before,'mobile review must never mutate game state');
  console.log('Mission 1450 mobile Chromium exercised real contract across five blocked scenarios');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
