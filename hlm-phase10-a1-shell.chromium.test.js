'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
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
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
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
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
