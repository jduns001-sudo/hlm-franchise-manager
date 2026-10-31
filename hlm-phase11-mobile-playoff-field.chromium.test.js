'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const {createGameStateEnvelope}=require('./hlm-game-state');
const KEY='hlm-phase11-m1340-isolated-single-game-v1',LOCK='hlm-phase11-m1340-isolated-single-game-lock';
let assertions=0,dialogs=0,played=0;const checks=[];
function check(value,label){++assertions;assert.ok(value,label);checks.push(label)}
const raw=page=>page.evaluate(k=>localStorage.getItem(k),KEY);
const saved=async page=>JSON.parse(await raw(page));
const countGames=state=>state.extensions.phase10Playoffs.rounds.flat().reduce((n,s)=>n+s.games.length,0);
function fixture(count=20,scheduled=false,rosters=false){
 const teams=Array.from({length:count},(_,i)=>({id:i+1,name:'Club '+(i+1)}));
 const players=[{id:'free-agent',name:'Free Agent'}];
 if(rosters)for(const t of teams)players.push({id:'skater-'+t.id,name:'Skater '+t.id,teamId:t.id,position:'C',overall:75},{id:'goalie-'+t.id,name:'Goalie '+t.id,teamId:t.id,position:'G',overall:75});
 return createGameStateEnvelope({meta:{saveId:'ui-field-'+count,currentDate:'2026-10-02',controlledTeamId:1},teams,players,prospects:[{id:'pros1',name:'Prospect One'}],contracts:[{contractId:'old1',playerId:'free-agent',teamId:1,aav:1000000,years:1,season:'2026-27',status:'active'}],draftPicks:[{pickId:'pick1',currentOwnerId:1,status:'available'}],games:teams.slice(0,-1).map((t,i)=>({id:'regular-'+i,date:'2026-10-01',homeTeamId:t.id,awayTeamId:count,status:scheduled?'scheduled':'final',homeGoals:i+1,awayGoals:0,overtime:false}))});
}
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1);if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(b)})});
(async()=>{let browser;const start=performance.now();
try{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));browser=await chromium.launch({headless:true});
 const origin='http://127.0.0.1:'+server.address().port,url=origin+'/hlm-phase11-isolated-single-game.html';
 async function pageInContext(context){const p=await context.newPage();p.setDefaultTimeout(10000);await p.goto(url);await p.locator('#playoff-spots').waitFor();return p}
 async function newContext(){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await c.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());return c}
 async function clickConfirm(p,selector,accept=true,expected){let message;const dialog=new Promise((resolve,reject)=>p.once('dialog',async d=>{try{++dialogs;message=d.message();await (accept?d.accept():d.dismiss());resolve()}catch(e){reject(e)}}));await p.locator(selector).click();await dialog;if(expected)check(expected.test(message),'confirmation identifies '+selector);return message}
 async function importState(p,state){await p.evaluate(()=>localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL'));await p.locator('#file').setInputFiles({name:'season.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});await p.waitForFunction(()=>!document.querySelector('#import').disabled);await clickConfirm(p,'#import');await p.waitForFunction(k=>!!localStorage.getItem(k),KEY)}
 async function reload(p){await p.reload();await p.waitForFunction(()=>!!document.querySelector('#playoff-spots')&&!!window.HLMGuardedMobileLifecycle)}
 const context=await newContext(),a=await pageInContext(context);check(await a.locator('#playoff-spots').inputValue()==='4','default field is four');check(await a.locator('#playoff-start').isDisabled(),'no franchise blocks qualification');check(/Load/.test(await a.locator('#playoff-field-status').innerText()),'no franchise reason displayed');
 const initial=fixture(20,false,true);await importState(a,initial);check(await a.evaluate(()=>!!navigator.locks?.request),'native Web Locks supported');
 let before=await raw(a);await a.locator('#playoff-spots').selectOption('16');check(await raw(a)===before,'selection is no-save');check(/Selected playoff field: 16/.test(await a.locator('#playoff-field-status').innerText()),'selected sixteen displayed');
 await clickConfirm(a,'#playoff-start',false,/top 16 teams/);check(await raw(a)===before,'cancelled sixteen qualification leaves exact save bytes');check(!(await a.locator('#playoff-spots').isDisabled()),'cancellation permits new selection');
 // Hold the exact application lock while the real UI creates its review snapshot.
 await a.evaluate(lock=>{window.held=new Promise(resolve=>navigator.locks.request(lock,async()=>{resolve();await new Promise(done=>window.releaseLock=done)}));return window.held},LOCK);
 await clickConfirm(a,'#playoff-start',true,/top 16 teams/);
 await a.waitForFunction(async lock=>(await navigator.locks.query()).pending.some(l=>l.name===lock),LOCK);
 check(await a.locator('#playoff-spots').isDisabled(),'selector disabled while approval waits on native lock');check(await raw(a)===before,'approval waiting for lock is no-save');
 // Deliberately mutate DOM after confirmation to verify the reviewed snapshot is authoritative.
 await a.evaluate(()=>{const select=document.querySelector('#playoff-spots');select.value='4';select.dispatchEvent(new Event('change',{bubbles:true}))});
 await a.evaluate(()=>window.releaseLock());await a.waitForFunction(k=>!!JSON.parse(localStorage.getItem(k)).extensions.phase10Playoffs,KEY);
 let current=await saved(a),bracket=current.extensions.phase10Playoffs;check(bracket.rounds[0].length===8,'snapshot still initializes sixteen despite later DOM mutation');check(bracket.rounds[0].every((s,i)=>s.highSeed.seed===i+1&&s.lowSeed.seed===16-i&&s.bestOf===7),'eight correctly paired best-of-seven series');check(await a.locator('#playoff-spots').inputValue()==='16'&&await a.locator('#playoff-spots').isDisabled(),'initialized field restored and locked');
 await reload(a);check(/Persisted playoff field: 16/.test(await a.locator('#playoff-field-status').innerText()),'persisted field displayed after reload');check(await a.locator('#playoff-spots').isDisabled(),'persisted bracket cannot change field');
 const b=await pageInContext(context);before=await raw(a);await clickConfirm(a,'#playoff-next',false);check(await raw(a)===before,'cancelled playoff game is no-save');
 // Two actual UI approvals queue behind one exclusive native lock.
 await a.evaluate(lock=>{window.held=new Promise(resolve=>navigator.locks.request(lock,async()=>{resolve();await new Promise(done=>window.releaseLock=done)}));return window.held},LOCK);
 await clickConfirm(a,'#playoff-next');await clickConfirm(b,'#playoff-next');
 await a.waitForFunction(async lock=>(await navigator.locks.query()).pending.filter(l=>l.name===lock).length===2,LOCK);check(await raw(a)===before,'both UI writes remain queued without save');await a.evaluate(()=>window.releaseLock());
 await Promise.all([a.waitForFunction(()=>/Persisted playoff game|changed/.test(document.querySelector('#playoff-report').textContent)),b.waitForFunction(()=>/Persisted playoff game|changed/.test(document.querySelector('#playoff-report').textContent))]);
 const messages=await Promise.all([a.locator('#playoff-report').innerText(),b.locator('#playoff-report').innerText()]);check(messages.filter(s=>/Persisted playoff game/.test(s)).length===1,'one actual UI write wins');check(messages.filter(s=>/changed/.test(s)).length===1,'stale tab UI rejects under native lock');current=await saved(a);check(countGames(current)===1,'two approvals persist one complete playoff result');played=1;
 await reload(a);let reloadedRounds=1;
 while((current=await saved(a)).extensions.phase10Playoffs.status==='active'){
  check(played<105,'sixteen-team journey bounded');before=await raw(a);await clickConfirm(a,'#playoff-next');await a.waitForFunction(({KEY,before})=>localStorage.getItem(KEY)!==before,{KEY,before});++played;
  const after=await raw(a),afterState=JSON.parse(after);
  check(countGames(afterState)===played,'game '+played+' saved exactly once');
  if(afterState.extensions.phase10Playoffs.rounds.length!==reloadedRounds||afterState.extensions.phase10Playoffs.status==='complete'){
   await reload(a);check(await raw(a)===after,'round transition at game '+played+' exact save survives reload');reloadedRounds=afterState.extensions.phase10Playoffs.rounds.length;
  }
  check(await a.evaluate(()=>localStorage.getItem('hlm_front_office_v8'))==='PRODUCTION_SENTINEL','game '+played+' production isolated');
 }
 bracket=current.extensions.phase10Playoffs;const champion=bracket.championTeamId;
 check(JSON.stringify(bracket.rounds.map(r=>r.length))==='[8,4,2,1]','four complete playoff rounds');check(bracket.rounds.flat().every(s=>s.status==='complete'),'all fifteen series complete');check(countGames(current)===played,'one authoritative playoff result per successful approval');check(JSON.stringify(current.activity.games)===JSON.stringify(initial.activity.games),'regular-season scoring unchanged');
 check(current.extensions.phase11ExperimentalBoxScores.length===played,'actual UI box-score adapter appends each rostered playoff game');
 await a.locator('#season-id').fill('2026-27');before=await raw(a);await clickConfirm(a,'#season-archive',false);check(await raw(a)===before,'archive cancellation no save');await clickConfirm(a,'#season-archive');await a.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).history.seasons.length===1,KEY);await reload(a);current=await saved(a);check(current.history.seasons[0].championTeamId===champion&&current.history.seasons[0].playoffRounds.length===4,'four-round champion archive survives reload');check(await a.locator('#season-archive').isDisabled(),'duplicate archive disabled');
 const operations={contracts:{expiredContractIds:['old1'],signings:[{playerId:'free-agent',teamId:1,contractId:'new1',aav:1500000,years:3,season:'2027-28',capLimit:10000000}]},draftSelections:[{pickId:'pick1',prospectId:'pros1',teamId:1}]};
 await a.locator('#next-season-id').fill('2027-28');await a.locator('#next-season-date').fill('2027-10-01');await a.locator('#offseason-operations').fill(JSON.stringify(operations));before=await raw(a);await a.locator('#offseason-review').click();check(await raw(a)===before,'actual offseason review no save');check(!(await a.locator('#next-season').isDisabled()),'review enables explicit offseason approval');await clickConfirm(a,'#next-season',false);check(await raw(a)===before,'actual offseason cancellation no save');await clickConfirm(a,'#next-season');await a.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).extensions.phase10CurrentSeasonId==='2027-28',KEY);
 const next=await raw(a);await reload(a);check(await raw(a)===next,'entire next-season save survives reload');current=await saved(a);check(current.meta.controlledTeamId===1&&current.history.seasons[0].championTeamId===champion,'GM authority and champion history persist');check(current.assets.contracts.some(c=>c.contractId==='new1')&&current.assets.draftPicks.some(p=>p.selectedProspectId==='pros1'),'approved offseason assets persist');check(current.activity.games.length>0&&current.activity.games.every(g=>g.status==='scheduled'),'next season playable schedule');check(await a.locator('#playoff-spots').inputValue()==='4'&&!(await a.locator('#playoff-spots').isDisabled()),'new season reload restores four-team default');check(await a.locator('#playoff-start').isDisabled()&&/Complete all regular-season/.test(await a.locator('#playoff-field-status').innerText()),'new season incomplete qualification explained');check(await a.evaluate(()=>localStorage.getItem('hlm_front_office_v8'))==='PRODUCTION_SENTINEL','production sentinel preserved through actual UI career');
 const legacyContext=await newContext(),legacy=await pageInContext(legacyContext);await importState(legacy,fixture(4));check(await legacy.locator('#playoff-spots').inputValue()==='4','legacy four default');before=await raw(legacy);await legacy.locator('#playoff-spots').selectOption('16');check(await legacy.locator('#playoff-start').isDisabled(),'four-team league cannot qualify sixteen');check(/16 required; 4 available/.test(await legacy.locator('#playoff-field-status').innerText()),'too-few-teams reason visible');check(await raw(legacy)===before,'unavailable field selection no save');await legacy.locator('#playoff-spots').selectOption('4');await clickConfirm(legacy,'#playoff-start',true,/top 4 teams/);await legacy.waitForFunction(k=>!!JSON.parse(localStorage.getItem(k)).extensions.phase10Playoffs,KEY);check((await saved(legacy)).extensions.phase10Playoffs.rounds[0].length===2,'actual default four-team bracket initialized');
 const emptyContext=await newContext(),empty=await pageInContext(emptyContext);const noGames=fixture();noGames.activity.games=[];await importState(empty,noGames);check(await empty.locator('#playoff-start').isDisabled()&&/at least one/.test(await empty.locator('#playoff-field-status').innerText()),'empty regular-season qualification explained');
 console.log(JSON.stringify({status:'passed',assertions,confirmationDialogs:dialogs,playoffGames:played,elapsedSeconds:(performance.now()-start)/1000,checks},null,2));
} catch(e){console.error(JSON.stringify({status:'failed',assertions,playoffGames:played,elapsedSeconds:(performance.now()-start)/1000,error:e.stack,checks},null,2));process.exitCode=1}
finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
})();
