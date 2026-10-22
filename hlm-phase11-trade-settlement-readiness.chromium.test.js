'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const names=['hlm-game-state.js','hlm-phase11-guarded-player-trade.js','hlm-phase11-trade-financial-eligibility.js','hlm-phase11-trade-restrictions.js','hlm-phase11-isolated-trade-decision.js','hlm-phase11-gm-trade-review.js','hlm-phase11-trade-settlement-readiness.js'];
const sources=Object.fromEntries(names.map(n=>[n,fs.readFileSync(n,'utf8')]));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><button id="review">Review readiness</button><button id="approve">Approve review</button><button id="decline">Decline</button><button id="cancel">Cancel</button><output id="result"></output>');
  await page.evaluate(({sources})=>{
   const modules={};function load(path){const n=path.replace(/^\.\//,'')+(path.endsWith('.js')?'':'.js');if(modules[n])return modules[n].exports;
    const m={exports:{}};modules[n]=m;new Function('module','exports','require',sources[n])(m,m.exports,load);return m.exports}
   const {createGameStateEnvelope}=load('hlm-game-state.js'),{createReadinessSession}=load('hlm-phase11-trade-settlement-readiness.js');
   const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],
    contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
   s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
   s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
   s.history.seasons=[{year:2034,champion:1}];
   const key='hlm-phase11-m1340-isolated-single-game-v1',prod='hlm_front_office_v8',map=new Map([[key,JSON.stringify(s)],[prod,'PRODUCTION_SENTINEL']]),writes=[];
   const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push(k);map.set(k,v)}},session=createReadinessSession(storage,key);
   const input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
   window.__audit={map,writes,key,prod,session,input};
   const out=document.getElementById('result');
   document.getElementById('review').onclick=()=>{const x=session.review(input);out.textContent=x.status+':'+x.receivingTeam.independentlyAuthenticated+':'+x.settlementAuthorized};
   for(const action of ['approve','decline','cancel'])document.getElementById(action).onclick=()=>{
    const x=session.decide(action==='approve'?'approve-review':action);out.textContent=x.status+':'+x.saved+':'+x.settlementAuthorized;
   };
  },{sources});
  await page.locator('#review').click();assert.equal(await page.locator('#result').textContent(),'review-ready-settlement-blocked:false:false');
  await page.locator('#decline').click();assert.equal(await page.locator('#result').textContent(),'declined:false:false');
  await page.locator('#review').click();await page.locator('#cancel').click();assert.equal(await page.locator('#result').textContent(),'cancelled:false:false');
  await page.locator('#review').click();await page.locator('#approve').click();assert.equal(await page.locator('#result').textContent(),'GM-review-approved:false:false');
  const audit=await page.evaluate(()=>{const a=window.__audit,s=JSON.parse(a.map.get(a.key));return {writes:a.writes,production:a.map.get(a.prod),teams:s.universe.players.map(p=>p.teamId),history:s.history.seasons}});
  assert.deepEqual(audit,{writes:[],production:'PRODUCTION_SENTINEL',teams:[1,2],history:[{year:2034,champion:1}]});
  console.log('Mission 1448 mobile receiving-team readiness and GM no-save acceptance passed');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
