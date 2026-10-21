'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const KEY='hlm-phase11-m1340-isolated-single-game-v1';
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(b)})});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await page.goto('http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html');
 await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL'));
 const startupErrors=[];
 page.on('pageerror',error=>startupErrors.push('pageerror: '+error.message));
 page.on('requestfailed',request=>startupErrors.push('requestfailed: '+request.url()+' '+(request.failure()?.errorText||'')));
 page.on('response',response=>{if(response.status()>=400)startupErrors.push('HTTP '+response.status()+': '+response.url())});
 try{await page.waitForFunction(()=>document.querySelector('#new-franchise')?.disabled===false,null,{timeout:30000})}
 catch(error){const diagnostics=await page.evaluate(()=>({status:document.querySelector('#new-status')?.textContent,teamCount:document.querySelector('#new-team')?.options.length,buttonDisabled:document.querySelector('#new-franchise')?.disabled,hasNewFranchise:!!window.HLMNewFranchise,hasLocks:!!navigator.locks,output:document.querySelector('#output')?.textContent?.slice(0,500)}));throw new Error('New franchise startup failed: '+JSON.stringify({diagnostics,startupErrors})+'; '+error.message)}
 const team=await page.locator('#new-team').inputValue();
 assert.ok(team,'real universe must offer a team');
 const before=await page.evaluate(key=>localStorage.getItem(key),KEY);
 page.once('dialog',d=>d.dismiss());await page.locator('#new-franchise').click();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),before,'declined franchise creation must not save');
 page.once('dialog',d=>d.accept());await page.locator('#new-franchise').click();
 await page.waitForFunction(key=>Boolean(localStorage.getItem(key)),KEY);
 let state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
 assert.equal(String(state.meta.controlledTeamId),team);
 assert.ok(state.activity.games.length>0,'real franchise must have scheduled games');
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
 await page.reload();await page.waitForFunction(()=>document.querySelector('#new-franchise')?.disabled===true&&document.querySelector('#game')?.options.length>0);
 assert.equal(await page.locator('#new-franchise').isDisabled(),true,'reload cannot overwrite existing franchise');
 const first=await page.locator('#game option').first().getAttribute('value');
 assert.ok(first,'scheduled game must be selectable');
 await page.locator('#game').selectOption(first);
 const saveBeforeReview=await page.evaluate(key=>localStorage.getItem(key),KEY);
 await page.locator('#gm-game-day-review').click();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),saveBeforeReview,'lineup review must not save');
 await page.locator('#day-review').click();
 assert.match(await page.locator('#day-report').innerText(),/Approval required/);
 const beforeCancel=await page.evaluate(key=>localStorage.getItem(key),KEY);
 page.once('dialog',d=>d.dismiss());await page.locator('#day-approve').click();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),beforeCancel,'cancelled simulation must not save');
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
 // Mission 1430: validate existing playoff entry guards against unapproved saves.
 const playoffBefore=await page.evaluate(key=>localStorage.getItem(key),KEY);
 if(await page.locator('#playoff-start').isEnabled()){
   page.once('dialog',d=>d.dismiss());await page.locator('#playoff-start').click();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),playoffBefore,'declined playoff qualification must not save');
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL','playoff review must isolate production save');
 // Mission 1431: an explicit human GM approval persists one real-universe regular-season day.
 await page.locator('#day-review').click();
 const approvedBefore=await page.evaluate(key=>localStorage.getItem(key),KEY);
 page.once('dialog',d=>d.accept());await page.locator('#day-approve').click();
 await page.waitForFunction(({key,before})=>{const after=localStorage.getItem(key);return Boolean(after)&&after!==before},{key:KEY,before:approvedBefore}).catch(async()=>{throw new Error('Approved regular-season day did not persist')});
 const approved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
 assert.ok(approved.activity.games.some(g=>g.status==='final'||g.status==='completed'||g.result),'GM-approved day must finalize a game');
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#new-franchise')?.disabled===true);
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activity.games.filter(g=>g.status==='final'||g.status==='completed'||g.result).length,KEY)>0,true,'approved game must survive reload');
 // Mission 1432: advance a second separately reviewed day; cancelled approval remains no-save.
 const finalsBefore=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activity.games.filter(g=>g.status==='final'||g.status==='completed'||g.result).length,KEY);
 await page.locator('#day-review').click();
 const day2Before=await page.evaluate(key=>localStorage.getItem(key),KEY);
 page.once('dialog',d=>d.dismiss());await page.locator('#day-approve').click();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),day2Before,'declined second-day approval must not save');
 await page.locator('#day-review').click();
 page.once('dialog',d=>d.accept());await page.locator('#day-approve').click();
 await page.waitForFunction(({key,before})=>localStorage.getItem(key)!==before,{key:KEY,before:day2Before});
 const finalsAfter=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activity.games.filter(g=>g.status==='final'||g.status==='completed'||g.result).length,KEY);
 assert.ok(finalsAfter>finalsBefore,'second approved day must finalize additional scheduled games');
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#new-franchise')?.disabled===true);
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activity.games.filter(g=>g.status==='final'||g.status==='completed'||g.result).length,KEY),finalsAfter,'both approved days must survive reload');
 // Mission 1434: complete the actual imported-universe schedule via separate human GM day approvals.
 // Each approval uses the application's guarded UI path, never direct save mutation.
 let regularSeasonApprovals=0;
 while(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activity.games.some(g=>g.status==='scheduled'),KEY)){
   assert.ok(regularSeasonApprovals<450,'regular season did not finish within 450 GM-approved days');
   await page.locator('#day-review').click();
   assert.equal(await page.locator('#day-approve').isEnabled(),true,'each regular-season day must be reviewed before approval');
   const prior=await page.evaluate(key=>localStorage.getItem(key),KEY);
   page.once('dialog',d=>d.accept());await page.locator('#day-approve').click();
   await page.waitForFunction(({key,before})=>localStorage.getItem(key)!==before,{key:KEY,before:prior},{timeout:30000});
   regularSeasonApprovals++;
 }
 assert.ok(regularSeasonApprovals>0,'must complete remaining regular season through GM-approved actions');
 assert.equal(await page.locator('#playoff-start').isEnabled(),true,'completed regular season must unlock playoff qualification');
 console.log('Mission 1434 completed real-universe season in '+regularSeasonApprovals+' additional explicitly GM-approved days');
 // Mission 1433: qualify real-universe playoffs only after every regular-season game is final.
 const remaining=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activity.games.filter(g=>g.status==='scheduled').length,KEY);
 assert.equal(await page.locator('#playoff-start').isEnabled(),remaining===0,'playoff qualification gate must track regular-season completion');
 assert.equal(remaining,0,'completed-season playoff acceptance must be exercised');
 if(remaining===0){
   const playoffBeforeApproval=await page.evaluate(key=>localStorage.getItem(key),KEY);
   page.once('dialog',d=>d.dismiss());await page.locator('#playoff-start').click();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),playoffBeforeApproval,'declined playoff qualification must not save');
   page.once('dialog',d=>d.accept());await page.locator('#playoff-start').click();
   await page.waitForFunction(({key,before})=>localStorage.getItem(key)!==before,{key:KEY,before:playoffBeforeApproval});
   assert.equal(await page.locator('#playoff-next').isEnabled(),true,'approved playoff bracket must allow first best-of-seven game');
   const playoffBeforeGame=await page.evaluate(key=>localStorage.getItem(key),KEY);
   page.once('dialog',d=>d.dismiss());await page.locator('#playoff-next').click();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),playoffBeforeGame,'declined playoff game must not save');
   assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
   await page.reload();await page.waitForFunction(()=>document.querySelector('#playoff-next')?.disabled===false);
   // Mission 1435: finish the actual best-of-seven bracket with one explicit GM approval per game.
   let playoffApprovals=0;
   while(await page.locator('#playoff-next').isEnabled()){
     assert.ok(playoffApprovals<45,'best-of-seven playoff bracket exceeded 45 approved games');
     const beforePlayoff=await page.evaluate(key=>localStorage.getItem(key),KEY);
     page.once('dialog',d=>d.accept());await page.locator('#playoff-next').click();
     await page.waitForFunction(({key,before})=>localStorage.getItem(key)!==before,{key:KEY,before:beforePlayoff},{timeout:30000});
     playoffApprovals++;
   }
   const champion=await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));return s.extensions?.phase10Playoffs?.championTeamId??s.extensions?.phase11Playoffs?.championTeamId??null},KEY);
   assert.ok(champion!=null,'completed best-of-seven bracket must identify a champion');
   assert.ok(playoffApprovals>=8,'four-team best-of-seven bracket must require multiple playoff games');
   assert.equal(await page.locator('#season-archive').isEnabled(),true,'completed playoffs must unlock championship archive');
   assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#season-archive')?.disabled===false);
   assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).extensions.phase10Playoffs.championTeamId,KEY),champion,'champion must persist unchanged after reload');
   assert.equal(await page.locator('#playoff-next').isDisabled(),true,'completed playoffs must stay complete after reload');
   // Mission 1436: archive only after explicit GM confirmation, and persist champion history.
   const archiveSeasonId=await page.locator('#season-id').inputValue();
   const beforeArchive=await page.evaluate(key=>localStorage.getItem(key),KEY);
   const previousArchives=JSON.parse(beforeArchive).history?.seasons?.length||0;
   page.once('dialog',d=>d.dismiss());await page.locator('#season-archive').click();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),beforeArchive,'declined championship archive must not save');
   page.once('dialog',d=>d.accept());await page.locator('#season-archive').click();
   await page.waitForFunction(({key,before})=>localStorage.getItem(key)!==before,{key:KEY,before:beforeArchive},{timeout:30000});
   const archived=await page.evaluate(({key,seasonId})=>{
     const state=JSON.parse(localStorage.getItem(key));
     return {history:state.history?.seasons||[],seasonId,champion:state.extensions?.phase10Playoffs?.championTeamId};
   },{key:KEY,seasonId:archiveSeasonId});
   assert.equal(archived.history.length,previousArchives+1,'GM-approved archive must add exactly one season');
   const archivedSeason=archived.history.find(s=>String(s.seasonId)===archiveSeasonId);
   assert.ok(archivedSeason,'approved season ID must appear in franchise history');
   assert.equal(archivedSeason.championTeamId,champion,'archived champion must match verified playoff winner');
   assert.equal(await page.locator('#season-archive').isDisabled(),true,'already archived season must not be archived twice');
   assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#offseason-review')?.disabled===false);
   const historyAfterReload=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).history?.seasons||[],KEY);
   assert.deepEqual(historyAfterReload,archived.history,'championship archive must persist unchanged after reload');
   assert.equal(await page.locator('#season-archive').isDisabled(),true,'archived season must remain protected after reload');
   // Mission 1437: reviewed offseason must be a read-only preview; only human GM approval advances the season.
   const nextSeasonId=await page.locator('#next-season-id').inputValue();
   const nextSeasonDate=await page.locator('#next-season-date').inputValue();
   const beforeOffseason=await page.evaluate(key=>localStorage.getItem(key),KEY);
   assert.equal(await page.locator('#next-season').isDisabled(),true,'next-season approval requires a fresh review');
   // Mission 1439: the real-universe starter currently has no imported contracts or draft assets.
   // Reject non-existent asset operations atomically rather than inventing contract or pick IDs.
   const realAssets=await page.evaluate(key=>{
     const state=JSON.parse(localStorage.getItem(key));
     return {contracts:state.assets?.contracts?.length||0,picks:state.assets?.draftPicks?.length||0,prospects:state.universe?.prospects?.length||0,players:state.universe?.players?.length||0};
   },KEY);
   assert.ok(realAssets.players>0,'real-universe franchise must retain actual players');
   assert.equal(realAssets.contracts,0,'starter currently has no source-backed contract assets');
   assert.equal(realAssets.picks,0,'starter currently has no source-backed draft picks');
   assert.equal(realAssets.prospects,0,'starter currently has no source-backed prospects');
   const offseasonInput=page.locator('#offseason-operations');
   const originalOffseasonOperations=await offseasonInput.inputValue();
   for(const invalid of [
     {contracts:{expiredContractIds:['nonexistent-contract'],signings:[]},draftSelections:[]},
     {contracts:{expiredContractIds:[],signings:[]},draftSelections:[{pickId:'nonexistent-pick',prospectId:'nonexistent-prospect',teamId:Number(team)}]}
   ]){
     await offseasonInput.fill(JSON.stringify(invalid));
     await page.locator('#offseason-review').click();
     assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),beforeOffseason,'invalid real-universe offseason operation must not write');
     assert.equal(await page.locator('#next-season').isDisabled(),true,'invalid offseason must not enable GM approval');
     assert.match(await page.locator('#offseason-preview').innerText(),/missing|not found|invalid|error/i,'invalid asset must be rejected with a reason');
   }
   await offseasonInput.fill(originalOffseasonOperations);

   await page.locator('#offseason-review').click();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),beforeOffseason,'offseason preview must not persist changes');
   assert.equal(await page.locator('#next-season').isEnabled(),true,'valid offseason review must enable explicit GM approval');
   assert.match(await page.locator('#offseason-preview').innerText(),/Review only, nothing saved/);
   page.once('dialog',d=>d.dismiss());await page.locator('#next-season').click();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),beforeOffseason,'declined next-season approval must not save');
   page.once('dialog',d=>d.accept());await page.locator('#next-season').click();
   await page.waitForFunction(({key,before})=>localStorage.getItem(key)!==before,{key:KEY,before:beforeOffseason},{timeout:30000});
   const nextState=await page.evaluate(key=>{
     const state=JSON.parse(localStorage.getItem(key));
     return {history:state.history?.seasons||[],seasons:state.activity?.seasons||[],games:state.activity?.games||[],seasonId:state.extensions?.phase10CurrentSeasonId,currentDate:state.meta?.currentDate};
   },KEY);
   assert.deepEqual(nextState.history,archived.history,'new season must preserve archived championship history');
   assert.equal(nextState.seasonId,nextSeasonId,'approved next-season ID must match GM-reviewed season');
   assert.equal(nextState.currentDate,nextSeasonDate,'approved next-season date must match GM-reviewed start');
   const expectedFirstGameDate=new Date(Date.parse(nextSeasonDate+'T00:00:00Z')+86400000).toISOString().slice(0,10);
   assert.ok(nextState.games.some(g=>g.status==='scheduled'&&g.date===expectedFirstGameDate),'first scheduled round must occur one day after reviewed season start');
   assert.ok(nextState.games.some(g=>g.status==='scheduled'),'approved next season must schedule games');
   assert.equal(await page.locator('#next-season').isDisabled(),true,'approval must clear reviewed offseason state');
   assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#offseason-review')!=null);
   const reloadedNext=await page.evaluate(key=>{
     const state=JSON.parse(localStorage.getItem(key));
     return {history:state.history?.seasons||[],seasons:state.activity?.seasons||[],games:state.activity?.games||[],seasonId:state.extensions?.phase10CurrentSeasonId,currentDate:state.meta?.currentDate};
   },KEY);
   assert.deepEqual(reloadedNext,nextState,'approved next-season schedule and championship history must survive reload');
   assert.equal(await page.locator('#next-season').isDisabled(),true,'reviewed approval must not survive reload');
   console.log('Mission 1437 GM-approved next season '+nextSeasonId+' with '+nextState.games.filter(g=>g.status==='scheduled').length+' scheduled games');
   console.log('Mission 1436 archived '+archiveSeasonId+' with champion '+champion+' through explicit GM approval and reload');
   console.log('Mission 1435 completed '+playoffApprovals+' individually GM-approved playoff games; champion field: '+champion);
   console.log('Mission 1433 approved playoff bracket and declined playoff game survived reload');
 }else console.log('Mission 1433 playoff gate confirmed blocked with '+remaining+' regular-season games remaining');
 console.log('Mission 1432 two GM-approved real-universe days, second-day cancel and reload passed');
 console.log('Mission 1431 GM-approved real-universe regular-season day and reload continuity passed');
 console.log('Mission 1429 real-universe mobile new franchise, cancel, reload, lineup review, day review and production isolation passed');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}})().catch(e=>{console.error(e);process.exitCode=1});
