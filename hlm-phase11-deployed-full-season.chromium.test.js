'use strict';
/* Mission 1389: live GitHub Pages acceptance in a fresh disposable Chromium context. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const crypto=require('node:crypto');
const base='https://jduns001-sudo.github.io/hlm-franchise-manager/';
const expected=process.env.EXPECTED_NHL_JS_BLOB||'026b8c0cab5f89202237bc8cfafd00df0aa48507';
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const url=new URL('hlm-phase11-isolated-single-game.html',base);
  url.searchParams.set('acceptance','mission1389-'+Date.now());
  const js=new URL('hlm-phase11-new-franchise.js',base);
  js.searchParams.set('acceptance','mission1389-'+Date.now());
  const response=await context.request.get(js.toString(),{headers:{'Cache-Control':'no-cache'},timeout:45000});
  assert.equal(response.status(),200);
  assert.equal(gitBlob(await response.text()),expected,'deployed selector JS must match reviewed source');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','MISSION1389_PRODUCTION_SENTINEL'));
  await page.waitForFunction(()=>document.querySelector('#new-team')?.options.length===32&&!document.querySelector('#new-franchise')?.disabled,{timeout:60000});
  const options=await page.locator('#new-team option').evaluateAll(nodes=>nodes.map(n=>({id:n.value,label:n.textContent})));
  assert.equal(options.length,32);
  assert.equal(new Set(options.map(x=>x.id)).size,32);
  assert.equal(new Set(options.map(x=>x.label)).size,32);
  assert.deepEqual(options.filter(x=>x.label==='Calgary (CGY)').map(x=>x.id),['20']);
  assert.deepEqual(options.filter(x=>x.label==='Chicago (CHI)').map(x=>x.id),['16']);
  assert.ok(!options.some(x=>/Chicoutimi/.test(x.label)));
  await page.locator('#new-team').selectOption('5');
  page.once('dialog',d=>d.dismiss());
  await page.locator('#new-franchise').click();
  assert.match(await page.locator('#output').innerText(),/No isolated save loaded/);
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).sort()),['hlm_front_office_v8']);
  page.once('dialog',d=>d.accept());
  await page.locator('#new-franchise').click();
  await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining:'),{timeout:60000});
  const before=await page.evaluate(()=>Object.keys(localStorage).map(key=>({key,value:localStorage.getItem(key)})));
  const save=before.find(x=>x.key!=='hlm_front_office_v8'&&x.value.includes('phase11ExperimentalRosterAwareScores'));
  assert.ok(save,'isolated franchise save exists');
  const state=JSON.parse(save.value);
  assert.equal(state.meta.controlledTeamId,5,'Pittsburgh GM controls selected franchise');
  assert.ok(state.universe.players.some(p=>String(p.teamId)==='5'),'real Pittsburgh players present');
  assert.equal(state.extensions.phase11ExperimentalRosterAwareScores,false);
  assert.ok(state.activity.games.length>0,'scheduled season exists');
  assert.equal(before.find(x=>x.key==='hlm_front_office_v8').value,'MISSION1389_PRODUCTION_SENTINEL');
  assert.equal(await page.locator('#new-franchise').isDisabled(),true);
  await page.locator('#day-review').click();
  assert.match(await page.locator('#day-report').innerText(),/Approval required/);
  page.once('dialog',d=>d.dismiss());
  await page.locator('#day-approve').click();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),save.value,'GM cancellation cannot advance');
  await page.locator('#day-review').click();
  page.once('dialog',d=>d.accept());
  await page.locator('#day-approve').click();
  await page.waitForFunction(()=>document.querySelector('#day-report')?.textContent.includes('Persisted isolated day'),{timeout:60000});
  const progressed=await page.evaluate(k=>localStorage.getItem(k),save.key);
  assert.notEqual(progressed,save.value,'GM approval advances saved season');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining:'),{timeout:60000});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),progressed,'reload restores advanced season');
  assert.equal(await page.locator('#new-franchise').isDisabled(),true,'no overwrite after reload');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1389_PRODUCTION_SENTINEL');
  // A second consecutive human-approved day must build on the first, never rewind.
  const dayOne=JSON.parse(progressed);
  assert.notEqual(dayOne.meta.currentDate,state.meta.currentDate,'first day must advance calendar');
  assert.equal(dayOne.extensions.phase11ExperimentalRosterAwareScores,false);
  assert.equal(dayOne.activity.games.length,state.activity.games.length,'season schedule must be retained');
  const firstCompleted=dayOne.activity.games.filter(g=>g.status!=='scheduled').length;
  await page.locator('#day-review').click();
  assert.match(await page.locator('#day-report').innerText(),/Approval required/);
  page.once('dialog',d=>d.dismiss());
  await page.locator('#day-approve').click();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),progressed,'second-day cancellation cannot persist');
  await page.locator('#day-review').click();
  page.once('dialog',d=>d.accept());
  await page.locator('#day-approve').click();
  await page.waitForFunction(()=>document.querySelector('#day-report')?.textContent.includes('Persisted isolated day'),{timeout:60000});
  const dayTwoRaw=await page.evaluate(k=>localStorage.getItem(k),save.key);
  const dayTwo=JSON.parse(dayTwoRaw);
  assert.notEqual(dayTwo.meta.currentDate,dayOne.meta.currentDate,'second day advances date');
  assert.equal(dayTwo.activity.games.length,state.activity.games.length,'schedule continuity');
  assert.ok(dayTwo.activity.games.filter(g=>g.status!=='scheduled').length>=firstCompleted,'completed games cannot regress');
  assert.equal(dayTwo.meta.controlledTeamId,5,'controlled team retained');
  assert.equal(dayTwo.extensions.phase11ExperimentalRosterAwareScores,false,'experimental effects remain disabled');
  assert.ok(dayTwo.universe.players.some(p=>String(p.teamId)==='5'),'real roster survives both days');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining:'),{timeout:60000});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),dayTwoRaw,'two-day save reload exact');
  assert.equal(await page.locator('#new-franchise').isDisabled(),true,'cannot overwrite two-day franchise');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1389_PRODUCTION_SENTINEL');
  // A meaningful ten-day regular-season stretch, each day individually GM-approved.
  const initialIds=state.activity.games.map(g=>String(g.id));
  let prior=dayTwo;
  let priorRaw=dayTwoRaw;
  for(let day=3;day<=10;day++){
   await page.locator('#day-review').click();
   assert.match(await page.locator('#day-report').innerText(),/Approval required/,'day '+day+' must be reviewed');
   page.once('dialog',d=>d.accept());
   await page.locator('#day-approve').click();
   await page.waitForFunction(()=>document.querySelector('#day-report')?.textContent.includes('Persisted isolated day'),{timeout:60000});
   const raw=await page.evaluate(k=>localStorage.getItem(k),save.key);
   assert.notEqual(raw,priorRaw,'day '+day+' persisted a distinct state');
   const next=JSON.parse(raw);
   assert.ok(next.meta.currentDate>prior.meta.currentDate,'date must advance on day '+day);
   assert.deepEqual(next.activity.games.map(g=>String(g.id)),initialIds,'schedule identities remain stable on day '+day);
   const priorFinished=new Map(prior.activity.games.filter(g=>g.status!=='scheduled').map(g=>[String(g.id),JSON.stringify(g)]));
   for(const game of next.activity.games){if(priorFinished.has(String(game.id)))assert.equal(JSON.stringify(game),priorFinished.get(String(game.id)),'completed game immutable on day '+day)}
   assert.ok(next.activity.games.filter(g=>g.status!=='scheduled').length>=priorFinished.size,'completed count cannot regress');
   assert.equal(next.meta.controlledTeamId,5);
   assert.equal(next.extensions.phase11ExperimentalRosterAwareScores,false);
   assert.ok(next.universe.players.some(p=>String(p.teamId)==='5'));
   assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1389_PRODUCTION_SENTINEL');
   if(day===5||day===10){
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining:'),{timeout:60000});
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),raw,'exact save survives reload on day '+day);
    assert.equal(await page.locator('#new-franchise').isDisabled(),true);
   }
   prior=next;priorRaw=raw;
  }
  assert.ok(prior.activity.games.some(g=>g.status!=='scheduled'),'ten-day stretch must include played games');
  // Independent standings oracle: compute team wins/losses from saved final scores,
  // then compare with the season dashboard's standings (not another engine helper).
  const completed=prior.activity.games.filter(g=>g.status==='final');
  assert.ok(completed.length>0,'standings verification needs final games');
  const expectedRecords=new Map(prior.universe.teams.map(t=>[String(t.id),{gp:0,w:0,l:0,otl:0,gf:0,ga:0,points:0}]));
  for(const game of completed){
   const home=game.homeGoals,away=game.awayGoals;
   assert.ok(Number.isSafeInteger(home)&&Number.isSafeInteger(away)&&home>=0&&away>=0&&home!==away,'final game must have valid untied scores');
   const h=expectedRecords.get(String(game.homeTeamId)),a=expectedRecords.get(String(game.awayTeamId));
   assert.ok(h&&a&&h!==a,'final game teams must exist');
   h.gp++;a.gp++;h.gf+=home;h.ga+=away;a.gf+=away;a.ga+=home;
   const winner=home>away?h:a,loser=home>away?a:h;
   winner.w++;winner.points+=2;
   if(game.overtime===true){loser.otl++;loser.points++}else loser.l++;
  }
  const dashboard=await page.locator('#season-dashboard').innerText();
  assert.match(dashboard,/Standings:/,'deployed dashboard displays standings');
  const displayed=JSON.parse(dashboard.split('Standings:').pop().trim());
  assert.ok(Array.isArray(displayed),'dashboard standings are a team array');
  assert.equal(displayed.length,expectedRecords.size,'every NHL team has a standings row');
  for(const [id,record] of expectedRecords){
   const row=displayed.find(x=>String(x.teamId)===id);
   assert.ok(row,'standings row exists for team '+id);
   for(const field of ['gp','w','l','otl','gf','ga','points'])assert.equal(row[field],record[field],field+' matches final game ledger for '+id);
  }
  // Complete the actual generated regular-season schedule through individually reviewed, GM-approved days.
  const initialSchedule=new Map(state.activity.games.map(g=>[String(g.id),{date:g.date,homeTeamId:g.homeTeamId,awayTeamId:g.awayTeamId}]));
  let season=prior,days=10;
  const lastScheduledDate=state.activity.games.map(g=>g.date).sort().at(-1);
  while(season.activity.games.some(g=>g.status==='scheduled')){
   assert.ok(days<180,'season did not finish within 180 reviewed calendar days');
   const old=season;
   await page.locator('#day-review').click();
   assert.match(await page.locator('#day-report').innerText(),/Approval required/);
   page.once('dialog',d=>d.accept());
   await page.locator('#day-approve').click();
   await page.waitForFunction(()=>document.querySelector('#day-report')?.textContent.includes('Persisted isolated day'),{timeout:60000});
   season=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),save.key));days++;
   assert.ok(season.meta.currentDate>old.meta.currentDate,'GM-approved date increases');
   assert.equal(season.activity.games.length,initialSchedule.size,'schedule length preserved');
   const oldFinal=new Map(old.activity.games.filter(g=>g.status==='final').map(g=>[String(g.id),JSON.stringify(g)]));
   for(const g of season.activity.games){
    const identity=initialSchedule.get(String(g.id));assert.ok(identity,'schedule identity retained');
    assert.equal(g.date,identity.date);assert.equal(g.homeTeamId,identity.homeTeamId);assert.equal(g.awayTeamId,identity.awayTeamId);
    if(oldFinal.has(String(g.id)))assert.equal(JSON.stringify(g),oldFinal.get(String(g.id)),'final result immutable');
   }
   assert.equal(season.meta.controlledTeamId,5);
   assert.equal(season.extensions.phase11ExperimentalRosterAwareScores,false);
   if(days%20===0){
    const exact=await page.evaluate(k=>localStorage.getItem(k),save.key);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining:'),{timeout:60000});
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),exact,'periodic reload preserves entire season');
    assert.equal(await page.locator('#new-franchise').isDisabled(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1389_PRODUCTION_SENTINEL');
   }
  }
  assert.ok(season.meta.currentDate>=lastScheduledDate,'calendar reaches last scheduled game');
  assert.equal(season.activity.games.filter(g=>g.status==='final').length,initialSchedule.size,'all scheduled games completed');
  assert.equal(await page.locator('#playoff-start').isDisabled(),false,'postseason qualification available after full season');
  const oracle=new Map(season.universe.teams.map(t=>[String(t.id),{gp:0,w:0,l:0,otl:0,gf:0,ga:0,points:0}]));
  for(const g of season.activity.games){
   const h=oracle.get(String(g.homeTeamId)),a=oracle.get(String(g.awayTeamId));
   assert.ok(h&&a&&h!==a&&Number.isSafeInteger(g.homeGoals)&&Number.isSafeInteger(g.awayGoals)&&g.homeGoals!==g.awayGoals);
   h.gp++;a.gp++;h.gf+=g.homeGoals;h.ga+=g.awayGoals;a.gf+=g.awayGoals;a.ga+=g.homeGoals;
   const win=g.homeGoals>g.awayGoals?h:a,lose=g.homeGoals>g.awayGoals?a:h;win.w++;win.points+=2;
   if(g.overtime===true){lose.otl++;lose.points++}else lose.l++;
  }
  const board=await page.locator('#season-dashboard').innerText();
  const rows=JSON.parse(board.split('Standings:').pop().trim());
  assert.equal(rows.length,32);
  for(const [id,record] of oracle){
   const row=rows.find(r=>String(r.teamId)===id);assert.ok(row,'team '+id+' in final standings');
   for(const field of ['gp','w','l','otl','gf','ga','points'])assert.equal(row[field],record[field],field+' team '+id);
  }
  const seasonRaw=await page.evaluate(k=>localStorage.getItem(k),save.key);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#season-dashboard')?.textContent.includes('Standings:'),{timeout:60000});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),seasonRaw,'completed season reload exact');
  assert.equal(await page.locator('#playoff-start').isDisabled(),false);
  assert.equal(await page.locator('#new-franchise').isDisabled(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1389_PRODUCTION_SENTINEL');
  console.log('Mission 1389 full season: '+days+' individually approved days, '+initialSchedule.size+' completed games, 32-team standings reconciled, playoffs ready');
  console.log('Mission 1389 deployed mobile PASS: canonical 32, GM cancellation/approval, real roster, day, reload, no overwrite, experimental default off, production sentinel unchanged');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
