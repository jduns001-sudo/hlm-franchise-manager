'use strict';
/* Browser acceptance for Mission 1446. Runs isolated CommonJS modules in actual mobile Chromium,
 * with an in-page module resolver and instrumented localStorage. No app or production writes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const files=['hlm-game-state.js','hlm-phase11-guarded-player-trade.js','hlm-phase11-trade-financial-eligibility.js','hlm-phase11-trade-restrictions.js','hlm-phase11-isolated-trade-decision.js'];
const sources=Object.fromEntries(files.map(f=>[f,fs.readFileSync(f,'utf8')]));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated trade decision acceptance</title>');
  const result=await page.evaluate(({sources})=>{
   const modules={};
   function load(path){
    const name=path.replace(/^\.\//,'')+(path.endsWith('.js')?'':'.js');
    if(modules[name])return modules[name].exports;
    if(!sources[name])throw Error('Missing isolated source '+name);
    const m={exports:{}};modules[name]=m;
    new Function('module','exports','require',sources[name])(m,m.exports,load);
    return m.exports;
   }
   const {createGameStateEnvelope}=load('hlm-game-state.js');
   const {evaluate,createDecisionSession}=load('hlm-phase11-isolated-trade-decision.js');
   const key='hlm-phase11-m1340-isolated-single-game-v1',prod='hlm_front_office_v8';
   const fixture=()=>{
    const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],
     players:[{id:'a',teamId:1},{id:'b',teamId:2}],
     contracts:[{id:'a-contract',playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},
     {id:'b-contract',playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
    s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
    s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
    s.history.seasons=[{year:2034,champion:1}];return s;
   };
   const map=new Map([[key,JSON.stringify(fixture())],[prod,'PRODUCTION_SENTINEL']]);
   const writes=[];const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push(k);map.set(k,v)}};
   const input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
   const session=createDecisionSession(storage,key),before=map.get(key);
   const decision=session.propose(input);
   if(!decision.consentVerified||decision.settlementAuthorized||!decision.eligibleForFurtherReview)throw Error('Bad decision');
   let blocked=0;
   for(const approved of [false,true]){try{session.approve(approved)}catch(e){blocked++}}
   if(blocked!==2)throw Error('GM decline/approval must be blocked');
   if(map.get(key)!==before||writes.length)throw Error('Decision wrote save');
   session.propose(input);
   const changed=fixture();changed.meta.currentDate='2035-02-01';storage.setItem(key,JSON.stringify(changed));
   let stale=false;try{session.approve(true)}catch(e){stale=/Stale/.test(e.message)}
   if(!stale)throw Error('Stale review was accepted');
   session.reload();
   if(session.propose(input).settlementAuthorized)throw Error('Settlement authorized');
   const denied=fixture();denied.extensions.tradeDecisionConsents[0].decision='declined';
   let consentBlocked=false;try{evaluate(denied,input)}catch(e){consentBlocked=/consent/.test(e.message)}
   if(!consentBlocked)throw Error('Denied consent accepted');
   if(map.get(prod)!=='PRODUCTION_SENTINEL'||writes.some(k=>k===prod))throw Error('Production touched');
   if(JSON.parse(map.get(key)).history.seasons[0].champion!==1)throw Error('History lost');
   return {mobile:window.innerWidth<=390,blocked,stale,consentBlocked,productionUntouched:true,settlementAuthorized:false};
  },{sources});
  assert.deepEqual(result,{mobile:true,blocked:2,stale:true,consentBlocked:true,productionUntouched:true,settlementAuthorized:false});
  console.log('Mission 1446 isolated mobile Chromium decision acceptance passed',result);
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
