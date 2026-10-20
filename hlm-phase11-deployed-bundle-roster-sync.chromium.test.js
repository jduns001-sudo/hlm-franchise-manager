'use strict';
/* Mission 1394: live GitHub Pages acceptance in a fresh disposable Chromium context. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const crypto=require('node:crypto');
const fs=require('node:fs');
const base='https://jduns001-sudo.github.io/hlm-franchise-manager/';
const expected=process.env.EXPECTED_NHL_JS_BLOB||'026b8c0cab5f89202237bc8cfafd00df0aa48507';
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const url=new URL('hlm-phase11-isolated-single-game.html',base);
  url.searchParams.set('acceptance','mission1394-'+Date.now());
  const js=new URL('hlm-phase11-new-franchise.js',base);
  js.searchParams.set('acceptance','mission1394-'+Date.now());
  const bundleUrl=new URL('hlm-phase10-browser.bundle.js',base);
  bundleUrl.searchParams.set('acceptance','mission1394-'+Date.now());
  const bundleResponse=await context.request.get(bundleUrl.toString(),{headers:{'Cache-Control':'no-cache'},timeout:45000});
  assert.equal(bundleResponse.status(),200);
  const bundleText=await bundleResponse.text();
  const candidate=fs.readFileSync('hlm-phase10-browser.bundle.js','utf8');
  assert.ok(candidate.includes('signedPlayer.teamId=teamId;'),'PR bundle must contain roster movement');
  const liveRequired=process.env.MISSION1394_LIVE_PAGES==='1';
  if(liveRequired){assert.equal(gitBlob(bundleText),gitBlob(candidate),'post-deployment live Pages bundle must match reviewed main');}
  else {
   // Pages is deployed from main, not the draft PR. Test the actual Pages UI against
   // the PR's exact browser bundle without modifying the deployed site or user saves.
   await page.route('**/hlm-phase10-browser.bundle.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:candidate}));
   console.log('Mission 1394 PR preview: Pages HTML + exact candidate bundle; live deployment separately gated on main');
  }
  const response=await context.request.get(js.toString(),{headers:{'Cache-Control':'no-cache'},timeout:45000});
  assert.equal(response.status(),200);
  assert.equal(gitBlob(await response.text()),expected,'deployed selector JS must match reviewed source');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','MISSION1394_PRODUCTION_SENTINEL'));
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
  assert.equal(before.find(x=>x.key==='hlm_front_office_v8').value,'MISSION1394_PRODUCTION_SENTINEL');
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
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
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
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
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
   assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
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
    assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
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
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
  console.log('Mission 1394 full season: '+days+' individually approved days, '+initialSchedule.size+' completed games, 32-team standings reconciled, playoffs ready');
  // GM-approved playoff qualification and every best-of-seven game through championship.
  page.once('dialog',d=>d.dismiss());
  await page.locator('#playoff-start').click();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),seasonRaw,'declined playoff qualification cannot persist');
  page.once('dialog',d=>d.accept());
  await page.locator('#playoff-start').click();
  await page.waitForFunction(()=>document.querySelector('#playoff-report')?.textContent.includes('GM-approved playoff bracket initialized'),{timeout:60000});
  let playoffState=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),save.key));
  assert.equal(playoffState.extensions.phase10Playoffs.status,'active');
  assert.equal(playoffState.extensions.phase10Playoffs.bestOf,7);
  const seeds=playoffState.extensions.phase10Playoffs.rounds[0].flatMap(s=>[s.highSeed.teamId,s.lowSeed.teamId]);
  assert.equal(new Set(seeds.map(String)).size,4,'four unique playoff qualifiers');
  const regularSeasonLedger=JSON.stringify(season.activity.games);
  let playoffGames=0;
  while(playoffState.extensions.phase10Playoffs.status==='active'){
   assert.ok(playoffGames<30,'four-team bracket should finish within 30 games');
   const before=await page.evaluate(k=>localStorage.getItem(k),save.key);
   if(playoffGames===0){
    page.once('dialog',d=>d.dismiss());await page.locator('#playoff-next').click();
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),before,'declined playoff game cannot persist');
   }
   page.once('dialog',d=>d.accept());
   await page.locator('#playoff-next').click();
   await page.waitForFunction(({key,before})=>localStorage.getItem(key)!==before,{key:save.key,before},{timeout:60000});
   const after=await page.evaluate(k=>localStorage.getItem(k),save.key);
   assert.notEqual(after,before,'approved playoff game persisted');
   playoffState=JSON.parse(after);playoffGames++;
   assert.equal(JSON.stringify(playoffState.activity.games),regularSeasonLedger,'regular-season results never change during playoffs');
   const bracket=playoffState.extensions.phase10Playoffs;
   assert.equal(bracket.bestOf,7);
   for(const round of bracket.rounds)for(const series of round){
    const ids=[String(series.highSeed.teamId),String(series.lowSeed.teamId)];
    assert.equal(series.bestOf,7);
    const wins=Object.fromEntries(ids.map(id=>[id,0]));
    const gameIds=new Set();
    for(const game of series.games){
     assert.equal(game.status,'final');
     assert.ok(ids.includes(String(game.winnerTeamId)),'winner belongs to series');
     assert.ok(!gameIds.has(String(game.gameId)),'playoff game id unique within series');
     gameIds.add(String(game.gameId));wins[String(game.winnerTeamId)]++;
    }
    for(const id of ids)assert.equal(series.wins[id],wins[id],'series win count equals results');
    assert.ok(series.games.length<=7,'best-of-seven game cap');
    if(series.status==='complete')assert.equal(wins[String(series.winnerTeamId)],4,'series champion earned four wins');
   }
   if(playoffGames%5===0){
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#playoff-report')?.textContent.includes('Playoffs:'),{timeout:60000});
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),after,'playoff reload exact');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
   }
  }
  const finished=playoffState.extensions.phase10Playoffs;
  assert.equal(finished.status,'complete');
  assert.equal(finished.rounds.length,2,'semifinals and final completed');
  assert.ok(seeds.map(String).includes(String(finished.championTeamId)),'champion is qualified team');
  assert.equal(await page.locator('#season-archive').isDisabled(),false,'championship ready for GM archive');
  assert.equal(playoffState.extensions.phase11ExperimentalRosterAwareScores,false);
  assert.ok(playoffState.universe.players.some(p=>String(p.teamId)==='5'));
  const championshipRaw=await page.evaluate(k=>localStorage.getItem(k),save.key);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#playoff-report')?.textContent.includes('Playoffs:'),{timeout:60000});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),championshipRaw);
  assert.equal(await page.locator('#season-archive').isDisabled(),false);
  assert.equal(await page.locator('#new-franchise').isDisabled(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
  console.log('Mission 1394 playoffs: '+playoffGames+' GM-approved playoff games, two best-of-seven rounds, champion '+finished.championTeamId+', archive ready');
  // Explicit human GM archive, offseason review and approved next-season transition.
  const beforeArchive=await page.evaluate(k=>localStorage.getItem(k),save.key);
  page.once('dialog',d=>d.dismiss());await page.locator('#season-archive').click();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),beforeArchive,'declined championship archive cannot persist');
  page.once('dialog',d=>d.accept());await page.locator('#season-archive').click();
  await page.waitForFunction(({key,old})=>localStorage.getItem(key)!==old,{key:save.key,old:beforeArchive},{timeout:60000});
  let archived=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),save.key));
  assert.equal(archived.history.seasons.length,1,'one completed season archived');
  assert.equal(archived.history.seasons[0].seasonId,'2026-27');
  assert.equal(String(archived.history.seasons[0].championTeamId),String(finished.championTeamId));
  assert.equal(JSON.stringify(archived.activity.games),regularSeasonLedger,'archive preserves full season ledger');
  assert.equal(await page.locator('#season-archive').isDisabled(),true,'cannot duplicate archive');
  assert.equal(await page.locator('#offseason-review').isDisabled(),false,'offseason review available');
  // Controlled fixture layered onto the real NHL universe in disposable isolated storage only.
  await page.evaluate(key=>{const state=JSON.parse(localStorage.getItem(key));
   state.universe.players.push({id:'m1393-fa',name:'Offseason Free Agent',teamId:3,overall:72,position:'C'});
   state.universe.prospects.push({id:'m1393-prospect',name:'Draft Prospect'});
   state.assets.contracts.push({contractId:'m1393-old',playerId:'m1393-fa',teamId:3,aav:1000000,years:1,season:'2026-27',status:'active'});
   state.assets.draftPicks.push({pickId:'m1393-pick',currentOwnerId:5,status:'available'});
   localStorage.setItem(key,JSON.stringify(state));
  },save.key);
  const archivedRaw=await page.evaluate(k=>localStorage.getItem(k),save.key);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#career-report')?.textContent.includes('Archived championships:'),{timeout:60000});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),archivedRaw,'archive reload exact');
  assert.equal(await page.locator('#next-season').isDisabled(),true,'next season cannot start before review');
  const operations={contracts:{expiredContractIds:['m1393-old'],signings:[{playerId:'m1393-fa',teamId:5,contractId:'m1393-new',aav:1500000,years:3,season:'2027-28',capLimit:1000000000}]},draftSelections:[{pickId:'m1393-pick',prospectId:'m1393-prospect',teamId:5}]};
  await page.locator('#offseason-operations').fill(JSON.stringify(operations));
  assert.equal(await page.locator('#next-season').isDisabled(),true,'editing operations invalidates approval');
  await page.locator('#offseason-review').click();
  assert.equal(await page.locator('#next-season').isDisabled(),false,'review enables GM approval');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),archivedRaw,'offseason review is read-only');
  page.once('dialog',d=>d.dismiss());await page.locator('#next-season').click();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),archivedRaw,'declined next season cannot persist');
  page.once('dialog',d=>d.accept());await page.locator('#next-season').click();
  await page.waitForFunction(({key,old})=>localStorage.getItem(key)!==old,{key:save.key,old:archivedRaw},{timeout:60000});
  const next=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),save.key));
  assert.equal(next.history.seasons.length,1,'archived season persists into next season');
  assert.equal(next.assets.contracts.find(x=>x.contractId==='m1393-old').status,'expired');
  assert.equal(next.assets.contracts.find(x=>x.contractId==='m1393-new').aav,1500000);
  assert.equal(String(next.universe.players.find(x=>x.id==='m1393-fa').teamId),'5','deployed approved signing must move real roster');
  assert.match(await page.locator('#gm-roster').innerText(),/Offseason Free Agent/,'GM roster must display acquired player');
  // The deployed Pages bundle may lag this PR's roster-sync fix; Node CI verifies the changed source.
  assert.equal(next.assets.draftPicks.find(x=>x.pickId==='m1393-pick').status,'used');
  assert.equal(String(next.universe.prospects.find(x=>x.id==='m1393-prospect').draftedByTeamId),'5');

  assert.equal(String(next.history.seasons[0].championTeamId),String(finished.championTeamId));
  assert.equal(next.extensions.phase10CurrentSeasonId,'2027-28');
  assert.ok(next.activity.games.length>0&&next.activity.games.every(g=>g.status==='scheduled'),'fresh next-season schedule');
  assert.equal(next.meta.controlledTeamId,5);
  assert.ok(next.universe.players.some(p=>String(p.teamId)==='5'),'real Pittsburgh roster continues');
  assert.equal(next.extensions.phase11ExperimentalRosterAwareScores,false);
  assert.equal(await page.locator('#new-franchise').isDisabled(),true,'existing franchise protected');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
  const nextRaw=await page.evaluate(k=>localStorage.getItem(k),save.key);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining:'),{timeout:60000});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),save.key),nextRaw,'new season reload exact');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1394_PRODUCTION_SENTINEL');
  console.log('Mission 1394 lifecycle: GM-approved championship archived, offseason reviewed and approved, next season '+next.extensions.phase10CurrentSeasonId+' persisted');
  console.log('Mission 1394 deployed mobile PASS: canonical 32, GM cancellation/approval, real roster, day, reload, no overwrite, experimental default off, production sentinel unchanged');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
