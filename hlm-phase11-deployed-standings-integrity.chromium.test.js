'use strict';
/* Mission 1388: live GitHub Pages acceptance in a fresh disposable Chromium context. */
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
  url.searchParams.set('acceptance','mission1388-'+Date.now());
  const js=new URL('hlm-phase11-new-franchise.js',base);
  js.searchParams.set('acceptance','mission1388-'+Date.now());
  const response=await context.request.get(js.toString(),{headers:{'Cache-Control':'no-cache'},timeout:45000});
  assert.equal(response.status(),200);
  assert.equal(gitBlob(await response.text()),expected,'deployed selector JS must match reviewed source');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','MISSION1388_PRODUCTION_SENTINEL'));
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
  assert.equal(before.find(x=>x.key==='hlm_front_office_v8').value,'MISSION1388_PRODUCTION_SENTINEL');
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
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1388_PRODUCTION_SENTINEL');
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
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1388_PRODUCTION_SENTINEL');
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
   assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1388_PRODUCTION_SENTINEL');
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
  const completed=prior.activity.games.filter(g=>g.status!=='scheduled');
  assert.ok(completed.length>0,'standings verification needs completed games');
  const expectedRecords=new Map();
  const addTeam=(id,won)=>{const key=String(id);const r=expectedRecords.get(key)||{wins:0,losses:0};r[won?'wins':'losses']++;expectedRecords.set(key,r)};
  for(const game of completed){
   const home=Number(game.homeScore),away=Number(game.awayScore);
   assert.ok(Number.isFinite(home)&&Number.isFinite(away)&&home!==away,'completed game must have a winner');
   addTeam(game.homeTeamId,home>away);
   addTeam(game.awayTeamId,away>home);
  }
  const dashboard=await page.locator('#season-dashboard').innerText();
  assert.match(dashboard,/Standings:/,'deployed dashboard displays standings');
  const standingsText=dashboard.split('Standings:').pop();
  const displayed=JSON.parse(standingsText.trim());
  assert.ok(Array.isArray(displayed),'dashboard standings are a team array');
  for(const [id,record] of expectedRecords){
   const row=displayed.find(x=>String(x.teamId??x.id)===id);
   assert.ok(row,'standings row exists for team '+id);
   assert.equal(Number(row.wins??row.w),record.wins,'wins match game ledger for '+id);
   assert.equal(Number(row.losses??row.l),record.losses,'losses match game ledger for '+id);
  }
  console.log('Mission 1388 deployed mobile PASS: canonical 32, GM cancellation/approval, real roster, day, reload, no overwrite, experimental default off, production sentinel unchanged');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
