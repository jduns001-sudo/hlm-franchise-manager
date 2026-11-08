'use strict';
// Route production is genuine page refresh logic. States are disposable engine-built
// snapshots, not a played-through browser season. No hlm:a1-state events are injected.
const native=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
let assertions=0;const assert=new Proxy(native,{get(t,k){return typeof t[k]==='function'?(...args)=>{assertions++;return t[k](...args)}:t[k]}});
const engine={...require('./hlm-game-state'),...require('./hlm-phase10-season-playoffs'),...require('./hlm-phase10-playoff-simulation'),...require('./hlm-phase10-season-finalization')};
const SAVE='hlm-phase11-m1340-isolated-single-game-v1',PROD='hlm_front_office_v8',started=performance.now(),errors=[],checkpoints=[];
function fixtures(){
 const regular=engine.createGameStateEnvelope({meta:{saveId:'a209-disposable',controlledTeamId:1,currentDate:'2026-10-25'},teams:[1,2,3,4].map(id=>({id,name:'Fixture Team '+id})),games:[[1,2],[3,4],[1,3],[2,4],[1,4],[2,3]].map(([homeTeamId,awayTeamId],i)=>({id:'r'+i,date:'2026-10-20',homeTeamId,awayTeamId,status:'final',homeGoals:3,awayGoals:1,overtime:false})),extensions:{phase10CurrentSeasonId:'2026-27',phase11ExperimentalRosterAwareScores:false}});
 const active=engine.startSeasonPlayoffs(regular,4,7).nextState;let complete=active,steps=0;
 while(complete.extensions.phase10Playoffs.status==='active'){if(steps>=21)throw Error('Four-team fixture generation exceeded 21 playoff games');complete=engine.simulateNextPlayoffGame(complete,1350+steps++).nextState;}
 const archived=engine.finalizeChampionshipSeason(complete,'2026-27').nextState;
 const defensive=structuredClone(active);defensive.extensions.phase10Playoffs.status='unsupported-a209-fixture';
 return {states:[['playoff-start',regular,'playoff-start'],['playoff-next',active,'playoff-next'],['season-id',complete,'season-id'],['offseason-review',archived,'offseason-review'],['season-dashboard',defensive,'season-dashboard']],fixturePlayoffGames:steps};
}
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1);if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.html')?'text/html':name.endsWith('.json')?'application/json':'text/javascript');fs.readFile(path.join(__dirname,name),(e,b)=>e?res.writeHead(404).end():res.end(b))});
(async()=>{let browser;try{
 const prepared=fixtures();await new Promise(ok=>server.listen(0,'127.0.0.1',ok));browser=await chromium.launch({headless:true});const origin='http://127.0.0.1:'+server.address().port;
 for(const [route,state,focus] of prepared.states){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   await context.addInitScript(({prod})=>{
    const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;set.call(localStorage,prod,'A209_DISPOSABLE_PRODUCTION_SENTINEL');
    window.__a209={events:[],writes:[],actions:[]};
    Storage.prototype.setItem=function(k,v){if(this===localStorage)__a209.writes.push(k);return set.call(this,k,v)};
    Storage.prototype.removeItem=function(k){if(this===localStorage)__a209.writes.push(k);return remove.call(this,k)};
    Storage.prototype.clear=function(){if(this===localStorage)__a209.writes.push('*');return clear.call(this)};
    document.addEventListener('hlm:a1-state',e=>__a209.events.push({nextTarget:e.detail.nextTarget,loaded:e.detail.loaded}));
    document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&['new-franchise','import','day-review','day-approve','approve','playoff-start','playoff-next','season-archive','offseason-review','next-season'].includes(b.id))__a209.actions.push(b.id)},true);
   },{prod:PROD});
   const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push({route,message:e.message}));let dialogs=0;
   page.on('dialog',async d=>{dialogs++;await d.dismiss()});
   await page.goto(origin+'/hlm-phase11-isolated-single-game.html');await page.waitForFunction(()=>window.__a209.events.length>0);
   assert.deepEqual(page.viewportSize(),{width:390,height:844});
   // The single explicit fixture import is setup, separately approved by the harness.
   await page.locator('#a1-continue').click();assert.equal(await page.locator('#a1-nav [aria-current="page"]').innerText(),'More');
   await page.locator('#file').setInputFiles({name:'a209-fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
   // Replace only the default dismiss handler for the deliberately approved import.
   page.removeAllListeners('dialog');page.once('dialog',async d=>{dialogs++;await d.accept()});await page.locator('#import').click();
   await page.waitForFunction(({save,route})=>localStorage.getItem(save)!==null&&window.__a209.events.at(-1)?.loaded===true&&window.__a209.events.at(-1)?.nextTarget===route,{save:SAVE,route});
   page.on('dialog',async d=>{dialogs++;await d.dismiss()});
   const capture=()=>page.evaluate(({save,prod})=>({save:localStorage.getItem(save),prod:localStorage.getItem(prod),writes:__a209.writes.length,actions:__a209.actions.length}),{save:SAVE,prod:PROD});
   const before=await capture(),beforeDialogs=dialogs;
   assert.equal(before.prod,'A209_DISPOSABLE_PRODUCTION_SENTINEL');assert.deepEqual(JSON.parse(before.save),state,'import preserves engine-built fixture');
   assert.equal(await page.evaluate(()=>__a209.events.at(-1).nextTarget),route,'page derives target from persisted state');
   async function navigate(){
    await page.locator('#a1-nav [data-a1-tab="home"]').click();await page.locator('#a1-continue').click();
    assert.equal(await page.locator('#a1-nav [aria-current="page"]').innerText(),'Season',route+' owning tab');assert.ok(await page.locator('#'+focus).isVisible(),route+' visible');assert.equal(await page.evaluate(()=>document.activeElement.id),focus,route+' focused');
   }
   await navigate();assert.deepEqual(await capture(),before,route+' navigation is read-only');assert.equal(dialogs,beforeDialogs,route+' navigation never seeks approval');
   await page.reload();await page.waitForFunction(route=>__a209.events.at(-1)?.loaded===true&&__a209.events.at(-1)?.nextTarget===route,route);
   const reloaded=await capture();assert.equal(reloaded.save,before.save,route+' reload save bytes');assert.equal(reloaded.prod,before.prod,route+' reload sentinel');assert.equal(reloaded.writes,0,route+' reload no localStorage writes');assert.equal(reloaded.actions,0,route+' reload no GM handlers');assert.equal(dialogs,beforeDialogs,route+' reload no approval');
   await navigate();assert.deepEqual(await capture(),reloaded,route+' post-reload navigation read-only');assert.equal(dialogs,beforeDialogs);assert.deepEqual(errors,[]);
   checkpoints.push({route,status:'passed',classification:route==='season-dashboard'?'defensive unsupported-status import':'genuine page route from engine-built lifecycle snapshot'});
  }finally{await context.close()}
 }
 console.log(JSON.stringify({status:'passed',assertions,failedAssertions:0,skippedAssertions:0,elapsedSeconds:(performance.now()-started)/1000,viewport:{width:390,height:844},checkpoints,fixturePlayoffGames:prepared.fixturePlayoffGames,pageErrors:errors,limitations:['Four-team synthetic engine-built snapshots, not a browser-played season or real-universe acceptance.','season-dashboard is a defensive unsupported-status fixture, not a normal engine lifecycle state.','Explicit fixture imports are setup; navigation and reload never approve, simulate or save.']}));
 }catch(e){console.error(JSON.stringify({status:'failed',assertions,checkpoints,pageErrors:errors,error:e.stack,elapsedSeconds:(performance.now()-started)/1000}));process.exitCode=1}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}})();
