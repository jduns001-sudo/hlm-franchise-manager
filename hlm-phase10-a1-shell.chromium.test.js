'use strict';
let assertionCount=0;const nativeAssert=require('node:assert/strict');const assert=new Proxy(nativeAssert,{get(t,k){return typeof t[k]==='function'?(...args)=>{assertionCount++;return t[k](...args)}:t[k]}});const started=performance.now();
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const SAVE='hlm-phase11-m1340-isolated-single-game-v1',PROD='hlm_front_office_v8';
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));
 if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();
 fs.readFile(path.join(__dirname,name),(err,data)=>{
  if(err)return res.writeHead(404).end();
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');
  res.end(data);
 });
});
const active=page=>page.locator('#a1-nav [aria-current="page"]').innerText();
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch();
 try{
  const origin='http://127.0.0.1:'+server.address().port,url=origin+'/hlm-phase11-isolated-single-game.html';
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];let dialogs=0;page.on('dialog',()=>dialogs++);page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await context.addInitScript(()=>{window.__a207={writes:[],actions:[],lastState:null};const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;Storage.prototype.setItem=function(k,v){__a207.writes.push({key:k,local:this===localStorage});return set.call(this,k,v)};Storage.prototype.removeItem=function(k){__a207.writes.push({key:k,local:this===localStorage});return remove.call(this,k)};Storage.prototype.clear=function(){__a207.writes.push({key:'*',local:this===localStorage});return clear.call(this)};document.addEventListener('hlm:a1-state',e=>__a207.lastState=e.detail);document.addEventListener('click',e=>{const el=e.target.closest('button');if(el&&['new-franchise','import','day-review','day-approve','approve','playoff-start','playoff-next','season-archive','offseason-review','next-season'].includes(el.id))__a207.actions.push(el.id)},true);});
  await page.goto(url);
  await page.evaluate(p=>localStorage.setItem(p,'A1_PRODUCTION_SENTINEL'),PROD);
  await page.waitForFunction(()=>document.querySelector('#new-franchise')?.disabled===false,null,{timeout:30000});

  // Five-tab mobile navigation fixed to the bottom.
  const labels=await page.locator('#a1-nav button').allInnerTexts();
  assert.deepEqual(labels,['Home','Team','Season','Moves','More']);
  assert.equal(await active(page),'Home');
  const nav=await page.locator('#a1-nav').boundingBox();
  assert.ok(nav.y+nav.height>=843&&nav.width>=389,'bottom bar');
  for(const b of await page.locator('#a1-nav button').all())assert.ok((await b.boundingBox()).height>=44);
  assert.equal(await page.locator('#a1-dashboard-empty').innerText(),'No isolated franchise loaded. Production Front Office save is unchanged.');
  assert.match(await page.locator('#a1-continue').innerText(),/Start or import a franchise/);
  assert.equal(await page.locator('#a1-continue:visible').count(),1,'one Continue Franchise action is visible');
  assert.ok(!(await page.locator('#gm-next-action-link').isVisible()),'legacy next-action card is replaced by the unified Dashboard');
  assert.ok(!(await page.locator('#new-franchise').isVisible()),'More content hidden on Home');

  assert.equal(await page.evaluate(()=>__a207.lastState.nextTarget),'file','genuine empty-franchise route');
  // Genuine lifecycle-generated route: fresh page chooses file, without event injection.
  // Continue routes without saving.
  await page.locator('#a1-continue').click();
  assert.equal(await active(page),'More');
  assert.ok(await page.locator('#new-franchise').isVisible());
  assert.equal(await page.evaluate(()=>document.activeElement.id),'new-franchise');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),null);

  // Create an isolated franchise through the existing guarded handler.
  page.once('dialog',d=>d.accept());
  await page.locator('#new-franchise').click();
  await page.waitForFunction(k=>!!localStorage.getItem(k),SAVE);
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE);
  const team=saved.universe.teams.find(t=>String(t.id)===String(saved.meta.controlledTeamId));
  const players=saved.universe.players.filter(p=>String(p.teamId)===String(saved.meta.controlledTeamId));
  const selectedFranchise=await page.evaluate(k=>localStorage.getItem(k),SAVE);

  await page.locator('#a1-nav [data-a1-tab="home"]').click();
  const dd=await page.locator('#a1-dashboard-rows dd').allInnerTexts();
  assert.equal(dd[0],team.name,'dashboard team is source-backed');
  assert.ok(dd.includes(String(players.length)),'dashboard roster count matches save');
  assert.ok(dd.includes('Off by default'));
  assert.notEqual(saved.extensions?.phase11ExperimentalRosterAwareScores,true);
  assert.match(await page.locator('#a1-continue').innerText(),/Review next day/);

  // Team opens the existing controlled-team roster and Home returns without changing the save.
  await page.locator('#a1-nav [data-a1-tab="roster"]').click();
  assert.equal(await active(page),'Team');
  assert.ok(await page.locator('#gm-roster').isVisible());
  const sourceRoster=await page.locator('#gm-roster').innerText();
  assert.ok(sourceRoster.includes('Controlled team: '+team.name+' | Players: '+players.length));
  assert.ok(sourceRoster.includes(String(players[0].name||players[0].id)),'Team uses the selected franchise roster source');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),selectedFranchise);
  await page.locator('#a1-nav [data-a1-tab="home"]').click();
  assert.equal(await active(page),'Home');
  assert.equal((await page.locator('#a1-dashboard-rows dd').first().innerText()),team.name);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),selectedFranchise,'Team-to-Home navigation preserves selected franchise');

  // Home shows a read-only copy of the existing brief; Season still shows the original.
  const homeBrief=await page.locator('#a1-home-brief').innerText();
  assert.match(homeBrief,/Next scheduled day:/);
  assert.ok(!(await page.locator('#gm-daily-brief').isVisible()),'original brief is not duplicated on Home');
  const dayBefore=await page.evaluate(()=>document.getElementById('gm-daily-brief').textContent);
  assert.equal(homeBrief,dayBefore,'Home brief matches the existing brief text');
  await page.locator('#a1-nav [data-a1-tab="season"]').click();
  assert.ok(await page.locator('#gm-daily-brief').isVisible(),'Season keeps the brief');
  assert.equal(await page.locator('#gm-daily-brief').innerText(),homeBrief);
  await page.locator('#a1-nav [data-a1-tab="home"]').click();
  await page.locator('#a1-dashboard a[href="#gm-daily-brief"]').click();
  assert.equal(await active(page),'Season');
  assert.ok(await page.locator('#gm-daily-brief').isVisible());
  await page.locator('#a1-nav [data-a1-tab="roster"]').click();
  await page.locator('#a1-nav [data-a1-tab="home"]').click();
  assert.equal(await page.evaluate(()=>document.getElementById('gm-daily-brief').textContent),dayBefore,'viewing the brief does not advance the day');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),selectedFranchise,'viewing the brief performs no save');

  assert.equal(await page.evaluate(()=>__a207.lastState.nextTarget),'day-review','genuine loaded regular-season route');
  const beforeContinue=await page.evaluate(k=>localStorage.getItem(k),SAVE);
  await page.locator('#a1-continue').click();
  assert.equal(await active(page),'Season');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'day-review');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),beforeContinue,'Continue must not save');

  // Tab content separation.
  await page.locator('#a1-nav [data-a1-tab="roster"]').click();
  assert.ok(await page.locator('#gm-roster').isVisible());
  assert.ok((await page.locator('#gm-roster').innerText()).includes('Controlled team: '+team.name+' | Players: '+players.length));
  assert.ok(!(await page.locator('#day-review').isVisible()));
  await page.locator('#a1-nav [data-a1-tab="moves"]').click();
  assert.ok(await page.locator('#gm-draft-review').isVisible());
  assert.ok(!(await page.locator('#gm-roster').isVisible()));
  await page.locator('#a1-nav [data-a1-tab="more"]').click();
  assert.ok(await page.locator('#season-entry-safety').isVisible());
  // Existing in-page links switch to the owning tab.
  await page.locator('#block-a-navigation summary').click();
  await page.locator('#block-a-navigation a[href="#gm-roster"]').click();
  assert.equal(await active(page),'Team');

  // Existing day handlers still need explicit human approval; reload keeps state.
  await page.locator('#a1-continue').count();
  await page.locator('#a1-nav [data-a1-tab="home"]').click();
  await page.locator('#a1-continue').click();
  await page.locator('#day-review').click();
  page.once('dialog',d=>d.dismiss());await page.locator('#day-approve').click();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),beforeContinue,'declined approval must not save');
  page.once('dialog',d=>d.accept());await page.locator('#day-approve').click();
  await page.waitForFunction(([k,b])=>localStorage.getItem(k)!==b,[SAVE,beforeContinue]);
  const after=await page.evaluate(k=>localStorage.getItem(k),SAVE);
  await page.locator('#a1-nav [data-a1-tab="home"]').click();
  const row=await page.locator('#a1-dashboard-rows dd').allInnerTexts();
  assert.ok(row.some(t=>/^\d+ completed \| \d+ remaining$/.test(t)));
  await page.goto(url);
  await page.waitForFunction(()=>document.querySelector('#a1-dashboard-rows dd'));
  assert.equal(await active(page),'Home');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),after,'reload keeps the saved franchise');
  assert.equal((await page.locator('#a1-dashboard-rows dd').first().innerText()),team.name);
  await page.locator('#a1-nav [data-a1-tab="roster"]').click();
  assert.equal(await active(page),'Team');
  assert.ok((await page.locator('#gm-roster').innerText()).includes('Controlled team: '+team.name+' | Players: '+players.length),'reload retains the selected franchise roster');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),after,'opening Team after reload does not alter the save');
  await page.locator('#a1-nav [data-a1-tab="home"]').click();

  // Stale tab rejection still enforced by the existing handler.
  const stale=await context.newPage();
  await stale.goto(url);
  await stale.waitForFunction(()=>document.querySelector('#a1-dashboard-rows dd'));
  await stale.locator('#a1-continue').click();
  await stale.locator('#day-review').click();
  page.once('dialog',d=>d.accept());
  await page.locator('#a1-continue').click();
  await page.locator('#day-review').click();
  await page.locator('#day-approve').click();
  await page.waitForFunction(([k,b])=>localStorage.getItem(k)!==b,[SAVE,after]);
  const current=await page.evaluate(k=>localStorage.getItem(k),SAVE);
  stale.once('dialog',d=>d.accept());
  await stale.locator('#day-approve').click();
  await stale.waitForTimeout(1500);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),current,'stale tab must not overwrite newer save');
  await stale.close();

  assert.equal(await page.evaluate(k=>localStorage.getItem(k),PROD),'A1_PRODUCTION_SENTINEL','production save untouched');

  // A2-07: synthetic route events exercise navigation only, not lifecycle generation.
  assert.deepEqual(page.viewportSize(),{width:390,height:844});
  const mobileBefore=await page.evaluate(([save,prod])=>({save:localStorage.getItem(save),prod:localStorage.getItem(prod),writes:__a207.writes.length,actions:__a207.actions.length}),[SAVE,PROD]);
  const beforeDialogs=dialogs;
  async function noMobileAction(label){
   const after=await page.evaluate(([save,prod])=>({save:localStorage.getItem(save),prod:localStorage.getItem(prod),writes:__a207.writes.length,actions:__a207.actions.length}),[SAVE,PROD]);
   assert.deepEqual(after,mobileBefore,label+' preserves exact bytes and performs no storage or action calls');assert.equal(dialogs,beforeDialogs,label+' never prompts GM approval');
  }
  const mobileRoutes=[['file','More','new-franchise'],['day-review','Season','day-review'],['playoff-start','Season','playoff-start'],['playoff-next','Season','playoff-next'],['season-id','Season','season-id'],['offseason-review','Season','offseason-review'],['season-dashboard','Season','season-dashboard']];
  for(const [target,tab,focus]of mobileRoutes){
   const disabled=await page.evaluate(([target,focus])=>{const el=document.getElementById(focus),disabled='disabled'in el?el.disabled:null;if(disabled!==null)el.disabled=false;document.dispatchEvent(new CustomEvent('hlm:a1-state',{detail:{loaded:false,nextTarget:target}}));return disabled},[target,focus]);
   await page.locator('#a1-nav [data-a1-tab="home"]').click();await page.locator('#a1-continue').click();
   assert.equal(await active(page),tab,'mobile tab '+target);assert.ok(await page.locator('#'+focus).isVisible(),'mobile destination visible '+target);assert.equal(await page.evaluate(()=>document.activeElement.id),focus,'mobile focus '+target);await noMobileAction(target);
   await page.evaluate(([focus,disabled])=>{if(disabled!==null)document.getElementById(focus).disabled=disabled},[focus,disabled]);
  }
  // Each rejection must leave Home selected and retain every protected byte.
  for(const mode of ['disabled','missing','unknown']){
   await page.locator('#a1-nav [data-a1-tab="home"]').click();
   const wasDisabled=await page.evaluate(mode=>{const el=document.getElementById('day-review'),old=el.disabled;if(mode==='disabled')el.disabled=true;if(mode==='missing')el.id='a207-hidden-target';document.dispatchEvent(new CustomEvent('hlm:a1-state',{detail:{loaded:false,nextTarget:mode==='unknown'?'a207-unknown':'day-review'}}));return old},mode);
   await page.locator('#a1-continue').click();assert.equal(await active(page),'Home','mobile rejection '+mode);assert.match(await page.locator('#a1-continue-status').innerText(),mode==='disabled'?/review control is disabled/:mode==='missing'?/destination is missing/:/unrecognized franchise action/);await noMobileAction(mode);
   await page.evaluate(([mode,wasDisabled])=>{const el=document.getElementById(mode==='missing'?'a207-hidden-target':'day-review');el.id='day-review';el.disabled=wasDisabled},[mode,wasDisabled]);
  }
  await page.reload();await page.waitForFunction(()=>document.querySelector('#a1-dashboard-rows dd'));
  assert.deepEqual(page.viewportSize(),{width:390,height:844});assert.equal(await active(page),'Home','mobile reload restores genuine dashboard');assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),mobileBefore.save,'mobile reload retains authoritative franchise bytes');assert.equal(await page.evaluate(k=>localStorage.getItem(k),PROD),mobileBefore.prod,'mobile reload retains production sentinel');assert.equal(await page.evaluate(()=>__a207.lastState.nextTarget),'day-review','reload regenerates actual next action');assert.deepEqual(await page.evaluate(()=>__a207.actions),[],'reload never invokes GM actions');assert.equal(await page.evaluate(()=>__a207.writes.length),0,'reload does not write storage');

  // Responsive desktop layout.
  await page.setViewportSize({width:1280,height:800});
  const side=await page.locator('#a1-nav').boundingBox();
  assert.ok(side.x===0&&side.width<260&&side.height>=700,'desktop side navigation');
  assert.deepEqual(await page.locator('#a1-nav button').allInnerTexts(),['Home','Team','Season','Moves','More']);
  await page.locator('#a1-nav [data-a1-tab="roster"]').click();
  assert.equal(await active(page),'Team');
  assert.ok(await page.locator('#gm-roster').isVisible());
  await page.locator('#a1-nav [data-a1-tab="home"]').click();
  assert.equal(await active(page),'Home');
  assert.ok(await page.locator('#a1-dashboard').isVisible());
  // A2-05: navigation must not act on unavailable or unrecognized review destinations.
  const safeSave=await page.evaluate(k=>localStorage.getItem(k),SAVE);
  await page.evaluate(()=>document.getElementById('day-review').disabled=true);
  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('hlm:a1-state',{detail:{loaded:false,nextTarget:'day-review'}})));
  await page.locator('#a1-continue').click();
  assert.equal(await active(page),'Home','disabled review does not switch tabs');
  assert.match(await page.locator('#a1-continue-status').innerText(),/review control is disabled/);
  await page.evaluate(()=>document.getElementById('day-review').disabled=false);

  await page.evaluate(()=>document.getElementById('day-review').id='a2-05-temporary-id');
  await page.locator('#a1-continue').click();
  assert.equal(await active(page),'Home','missing review does not switch tabs');
  assert.match(await page.locator('#a1-continue-status').innerText(),/destination is missing/);
  await page.evaluate(()=>document.getElementById('a2-05-temporary-id').id='day-review');

  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('hlm:a1-state',{detail:{loaded:false,nextTarget:'unexpected-action'}})));
  await page.locator('#a1-continue').click();
  assert.equal(await active(page),'Home','unknown review does not silently route to dashboard');
  assert.match(await page.locator('#a1-continue-status').innerText(),/unrecognized franchise action/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),safeSave,'blocked navigation does not save');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),PROD),'A1_PRODUCTION_SENTINEL','blocked navigation leaves production sentinel untouched');

  // Exercise all seven source-backed routes without invoking their approval handlers.
  for(const [target,tab,focus] of [
   ['file','More','new-franchise'],['day-review','Season','day-review'],
   ['playoff-start','Season','playoff-start'],['playoff-next','Season','playoff-next'],
   ['season-id','Season','season-id'],['offseason-review','Season','offseason-review'],
   ['season-dashboard','Season','season-dashboard']
  ]){
   await page.evaluate(([id,nextTarget])=>{
    const el=document.getElementById(id);if('disabled' in el)el.disabled=false;
    document.dispatchEvent(new CustomEvent('hlm:a1-state',{detail:{loaded:false,nextTarget}}));
   },[focus,target]);
   await page.locator('#a1-nav [data-a1-tab="home"]').click();
   await page.locator('#a1-continue').click();
   assert.equal(await active(page),tab,'route tab for '+target);
   assert.equal(await page.evaluate(()=>document.activeElement.id),focus,'route focus for '+target);
   assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE),safeSave,'route must not save: '+target);
  }
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),PROD),'A1_PRODUCTION_SENTINEL');
  assert.deepEqual(errors,[]);
  console.log('Phase 10 A1 mobile navigation, dashboard, Continue routing, persistence and stale-tab guard passed');
  console.log(JSON.stringify({status:'passed',assertions:assertionCount,failedAssertions:0,elapsedSeconds:(performance.now()-started)/1000,mobileViewport:{width:390,height:844},syntheticMobileRoutes:mobileRoutes.map(r=>r[0]),genuineLifecycleRoutes:['file','day-review'],limitations:['Other five route states are injected navigation fixtures, not full lifecycle acceptance.','No full-season simulation or production release qualification.'],pageErrors:errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
