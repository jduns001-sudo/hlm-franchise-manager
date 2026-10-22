'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const names=['hlm-game-state.js','hlm-phase11-guarded-player-trade.js','hlm-phase11-trade-financial-eligibility.js','hlm-phase11-trade-restrictions.js','hlm-phase11-isolated-trade-decision.js','hlm-phase11-gm-trade-review.js'];
const sources=Object.fromEntries(names.map(n=>[n,fs.readFileSync(n,'utf8')]));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><button id="review">Review trade</button><button id="approve">Approve review</button><button id="decline">Decline</button><button id="cancel">Cancel</button><output id="result"></output>');
  await page.evaluate(({sources})=>{
   const modules={};
   function load(path){const name=path.replace(/^\.\//,'')+(path.endsWith('.js')?'':'.js');if(modules[name])return modules[name].exports;
    const m={exports:{}};modules[name]=m;new Function('module','exports','require',sources[name])(m,m.exports,load);return m.exports}
   const {createGameStateEnvelope}=load('hlm-game-state.js');
   const {createTradeReview}=load('hlm-phase11-gm-trade-review.js');
   const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],
    contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
   s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
   s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
   s.history.seasons=[{year:2034,champion:1}];
   const key='hlm-phase11-m1340-isolated-single-game-v1',prod='hlm_front_office_v8',map=new Map([[key,JSON.stringify(s)],[prod,'PRODUCTION_SENTINEL']]),writes=[];
   const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push(k);map.set(k,v)}};
   const gm=createTradeReview(storage,key),input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
   window.__audit={map,writes,key,prod,gm,input};
   const out=document.getElementById('result');
   document.getElementById('review').onclick=()=>{const x=gm.review(input);out.textContent=x.status+':'+x.decision.consentVerified};
   for(const action of ['approve','decline','cancel'])document.getElementById(action).onclick=()=>{
    const x=gm.decide(action==='approve'?'approve-review':action);out.textContent=x.status+':'+x.saved+':'+x.settlementAuthorized;
   };
  },{sources});
  await page.locator('#review').click();
  await assert.equal(await page.locator('#result').textContent(),'awaiting-human-GM-review:true');
  await page.locator('#decline').click();
  assert.equal(await page.locator('#result').textContent(),'declined:false:false');
  await page.locator('#review').click();await page.locator('#cancel').click();
  assert.equal(await page.locator('#result').textContent(),'cancelled:false:false');
  await page.locator('#review').click();await page.locator('#approve').click();
  assert.equal(await page.locator('#result').textContent(),'GM-review-approved:false:false');
  const audit=await page.evaluate(()=>{const a=window.__audit;return {writes:a.writes,production:a.map.get(a.prod),history:JSON.parse(a.map.get(a.key)).history.seasons,players:JSON.parse(a.map.get(a.key)).universe.players}});
  assert.deepEqual(audit.writes,[]);assert.equal(audit.production,'PRODUCTION_SENTINEL');
  assert.deepEqual(audit.history,[{year:2034,champion:1}]);
  assert.deepEqual(audit.players.map(p=>p.teamId),[1,2]);
  console.log('Mission 1447 mobile GM trade review, consent, decline, cancel, approve-no-save passed');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
