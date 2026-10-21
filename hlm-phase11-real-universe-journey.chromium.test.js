'use strict';
// Mobile real-universe connected acceptance: shipped NHL universe, no synthetic import.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(b)})});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch();try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL'));
 await page.waitForFunction(()=>document.querySelector('#new-franchise')&&!document.querySelector('#new-franchise').disabled,null,{timeout:30000});
 assert.equal(await page.locator('#new-team option').count(),32);
 await page.locator('#new-team').selectOption('5');
 page.once('dialog',d=>d.dismiss());await page.locator('#new-franchise').click();
 assert.match(await page.locator('#output').innerText(),/No isolated save loaded/);
 page.once('dialog',d=>d.accept());await page.locator('#new-franchise').click();
 await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining:'),null,{timeout:30000});
 const key=await page.evaluate(()=>Object.keys(localStorage).find(k=>k.startsWith('hlm-phase11-m1340-isolated-single-game')));
 assert.ok(key);
 const before=await page.evaluate(k=>localStorage.getItem(k),key);
 const decision=page.locator('.gm-day-command');
 assert.equal(await decision.locator('button').count(),3,'mobile GM decision center exposes review, approve and decline');
 await decision.locator('#gm-day-command-review').click();
 assert.equal(await decision.locator('#gm-day-command-confirm').isEnabled(),true,'review enables explicit GM approval');
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'review must never save');
 await decision.locator('#gm-day-command-decline').click();
 assert.equal(await decision.locator('#gm-day-command-confirm').isDisabled(),true,'decline revokes approval');
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'decline must not save');
 await decision.locator('#gm-day-command-review').click();
 page.once('dialog',d=>d.dismiss());await decision.locator('#gm-day-command-confirm').click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'cancelled mobile approval must not save');
 const gameDayState=JSON.parse(before);
 const gmGame=gameDayState.activity.games.find(g=>g.status==='scheduled'&&(String(g.homeTeamId)===String(gameDayState.meta.controlledTeamId)||String(g.awayTeamId)===String(gameDayState.meta.controlledTeamId)));
 assert.ok(gmGame,'real-universe season must contain a controlled-team matchup');
 await page.locator('#game').selectOption(String(gmGame.id));
 const workspace=page.locator('.gm-game-day-workspace');
 assert.equal(await workspace.locator('button').count(),4,'mobile GM workspace exposes four game-day actions');
 await workspace.locator('#gm-workspace-preview').click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'matchup preview must not save');
 await workspace.locator('#gm-workspace-review').click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'skater review must not save');
 const reviewStatus=await page.locator('#gm-game-day-approval-status').innerText();
 const canApprove=await workspace.locator('#gm-workspace-approve').isEnabled();
 const canDecline=await workspace.locator('#gm-workspace-decline').isEnabled();
 assert.equal(canDecline,canApprove,'decline is available exactly when a valid reviewed skater plan awaits human GM approval');
 if(canApprove){
   assert.match(reviewStatus,/Human GM approval required/,'review must establish a pending skater plan');
   await workspace.locator('#gm-workspace-decline').click();
   assert.equal(await workspace.locator('#gm-workspace-approve').isDisabled(),true,'declined lineup cannot be approved');
   assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'decline must not save');
   await workspace.locator('#gm-workspace-review').click();
   assert.equal(await workspace.locator('#gm-workspace-approve').isEnabled(),true,'re-review restores pending GM approval');
   page.once('dialog',d=>d.dismiss());await workspace.locator('#gm-workspace-approve').click();
   assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'cancelled skater approval must not save');
 }else{
   assert.match(reviewStatus,/unavailable|ineligible|no eligible|not found|requires|missing|cannot|invalid|not scheduled|no skaters|No skaters|No eligible|No signed|need GM review|not approved/i,'unavailable review must provide an explicit reason');
   assert.equal(await workspace.locator('#gm-workspace-decline').isDisabled(),true,'no pending review means no decline action');
   assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'unavailable review must not save');
 }
 const dock=page.locator('.gm-command-dock');
 assert.equal(await dock.locator('a').count(),8,'mobile GM dock exposes eight real franchise destinations');
 assert.equal(await dock.getAttribute('aria-label'),'GM mobile command dock');
 await dock.getByRole('link',{name:'Roster'}).click();
 assert.equal(new URL(page.url()).hash,'#gm-roster');
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'navigation must never mutate franchise saves');
 await dock.getByRole('link',{name:'Advance day'}).click();
 assert.equal(new URL(page.url()).hash,'#day-review');
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'mobile quick navigation is read-only');
 const initial=JSON.parse(before);
 assert.equal(initial.universe.teams.length,32);
 assert.ok(initial.universe.players.length>100);
 assert.ok(initial.activity.games.length>12);
 assert.equal(initial.extensions.phase11ExperimentalRosterAwareScores,false);
 await page.locator('#day-review').click();
 page.once('dialog',d=>d.dismiss());await page.locator('#day-approve').click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'decline must not write');
 page.once('dialog',d=>d.accept());await page.locator('#day-approve').click();
 await page.waitForFunction(()=>document.querySelector('#day-report')?.textContent.includes('Persisted isolated day'),null,{timeout:30000});
 const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 assert.equal(after.activity.games.length,initial.activity.games.length,'retain real schedule');
 assert.ok(after.activity.games.some(g=>g.status==='final'));
 assert.equal(after.extensions.phase11ExperimentalRosterAwareScores,false);
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Completed:'),null,{timeout:30000});
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),JSON.stringify(after),'reload must not write');
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');

 // Complete the authentic regular season in this same browser save.
 let approvedDays=1;
 const totalGames=initial.activity.games.length;
 while(true){
  const state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  if(!state.activity.games.some(g=>g.status==='scheduled'))break;
  await page.locator('#day-review').click();
  page.once('dialog',d=>d.accept());
  await page.locator('#day-approve').click();
  const previous=state.activity.games.filter(g=>g.status==='final').length;
  await page.waitForFunction(({key,previous})=>{const s=JSON.parse(localStorage.getItem(key)||'null');return s&&s.activity.games.filter(g=>g.status==='final').length>previous},{key,previous},{timeout:30000});
  if(++approvedDays>totalGames)throw Error('Authentic regular season did not terminate');
 }
 const regular=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 assert.equal(regular.activity.games.length,totalGames);
 assert.equal(regular.activity.games.filter(g=>g.status==='final').length,totalGames);
 page.once('dialog',d=>d.dismiss());await page.locator('#playoff-start').click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),JSON.stringify(regular),'declined playoff start must not save');
 page.once('dialog',d=>d.accept());await page.locator('#playoff-start').click();
 await page.waitForFunction(()=>document.querySelector('#playoff-report')?.textContent.includes('bracket initialized'),null,{timeout:30000});
 let playoffGames=0;
 while(!(await page.locator('#playoff-next').isDisabled())){
  const previous=await page.evaluate(k=>localStorage.getItem(k),key);
  page.once('dialog',d=>d.accept());await page.locator('#playoff-next').click();
  await page.waitForFunction(({key,previous})=>localStorage.getItem(key)!==previous,{key,previous},{timeout:30000});
  if(++playoffGames>21)throw Error('Best-of-seven playoffs did not terminate');
 }
 assert.ok(playoffGames>=12&&playoffGames<=21);
 page.once('dialog',d=>d.accept());await page.locator('#season-archive').click();
 await page.waitForFunction(()=>document.querySelector('#career-report')?.textContent.includes('Archived champion'),null,{timeout:30000});
 await page.waitForFunction(k=>{const s=JSON.parse(localStorage.getItem(k)||'null');return !!s?.history?.seasons?.length},key,{timeout:30000});
 const archived=await page.evaluate(k=>localStorage.getItem(k),key);
 await page.locator('#offseason-operations').fill(JSON.stringify({contracts:{expiredContractIds:[],signings:[]},draftSelections:[]}));
 await page.locator('#offseason-review').click();
 await page.waitForFunction(()=>document.querySelector('#offseason-preview')?.textContent.includes('Review only'),null,{timeout:30000});
 const reviewedSnapshot=await page.evaluate(k=>localStorage.getItem(k),key);
 if(reviewedSnapshot!==archived){const a=JSON.parse(archived),b=JSON.parse(reviewedSnapshot);const keys=[...new Set([...Object.keys(a),...Object.keys(b)])];throw Error('Offseason review changed persisted fields: '+keys.filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).map(k=>k+': '+JSON.stringify(a[k]).length+' -> '+JSON.stringify(b[k]).length).join(', '));}
 page.once('dialog',d=>d.dismiss());await page.locator('#next-season').click();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),archived,'declined offseason must not save');
 page.once('dialog',d=>d.accept());await page.locator('#next-season').click();
 await page.waitForFunction(()=>document.querySelector('#career-report')?.textContent.includes('Started '),null,{timeout:30000});
 await page.reload();
 await page.locator('#output').waitFor();
 const rolled=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 assert.equal(rolled.universe.teams.length,32);
 assert.equal(rolled.universe.players.length,initial.universe.players.length);
 assert.equal(rolled.history.seasons.length,1);
 assert.ok(rolled.activity.games.some(g=>g.status==='scheduled'));
 assert.equal(rolled.extensions.phase11ExperimentalRosterAwareScores,false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');

 // Two real mobile tabs share the same isolated save. A stale GM approval must never overwrite a newer day.
 const second=await context.newPage();
 await second.goto(page.url(),{waitUntil:'domcontentloaded'});
 await second.waitForFunction(()=>document.querySelector('#day-review')&&!document.querySelector('#day-review').disabled,null,{timeout:30000});
 await second.locator('#day-review').click();
 await page.locator('#day-review').click();
 page.once('dialog',d=>d.accept());await page.locator('#day-approve').click();
 await page.waitForFunction(({key,previous})=>localStorage.getItem(key)!==previous,{key,previous:JSON.stringify(rolled)},{timeout:30000});
 const authoritative=await page.evaluate(k=>localStorage.getItem(k),key);
 assert.notEqual(authoritative,JSON.stringify(rolled),'first tab must advance the new season');
 second.once('dialog',d=>d.accept());await second.locator('#day-approve').click();
 await second.waitForFunction(()=>/changed|reload|conflict/i.test(document.querySelector('#day-report')?.textContent||''),null,{timeout:30000});
 assert.equal(await second.evaluate(k=>localStorage.getItem(k),key),authoritative,'stale second tab must not overwrite authoritative save');
 assert.equal(await second.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
 await second.reload();
 await second.waitForFunction(()=>document.querySelector('#day-review')&&!document.querySelector('#day-review').disabled,null,{timeout:30000});
 assert.equal(await second.evaluate(k=>localStorage.getItem(k),key),authoritative,'second-tab reload must preserve winner');
 await second.close();

 console.log('Mobile real-universe connected creation, day approval, declined no-save, authentic schedule, reload, production isolation and default-off passed');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}})().catch(e=>{console.error(e);process.exitCode=1});
