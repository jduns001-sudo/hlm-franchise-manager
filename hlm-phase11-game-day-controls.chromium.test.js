'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),base=require('assert/strict'),{chromium}=require('playwright');
let assertions=0;const started=performance.now(),assert=new Proxy(base,{get:(t,k)=>typeof t[k]==='function'?(...a)=>{assertions++;return t[k](...a)}:t[k]});
const server=http.createServer((q,r)=>{const f=q.url.split('?')[0].slice(1);if(!/^[\w.-]+$/.test(f))return r.writeHead(404).end();fs.readFile(path.join(__dirname,f),(e,b)=>{if(e)return r.writeHead(404).end();r.setHeader('content-type',f.endsWith('.js')?'text/javascript':f.endsWith('.json')?'application/json':'text/html');r.end(b)})});
(async()=>{let browser;const errors=[];try{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));browser=await chromium.launch();
 for(const width of [360,390,1280]){
  const c=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,serviceWorkers:'block'});
  try{
   const origin='http://127.0.0.1:'+server.address().port,entry=origin+'/hlm-phase11-isolated-single-game.html';
   await c.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
   await c.addInitScript(()=>{localStorage.setItem('hlm_front_office_v8','A2108_PRODUCTION_SENTINEL');window.controlPuts=0;window.simulationClicks=0;const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...a){controlPuts++;return put.apply(this,a)};document.addEventListener('click',e=>{if(['approve','day-approve','gm-workspace-day-confirm','gm-day-command-confirm','playoff-next'].includes(e.target.id))simulationClicks++},true)});
   const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
   const record=()=>p.evaluate(()=>HLMIsolatedAtomicSave.create({indexedDB}).read());
   const allSaved=()=>p.evaluate(()=>new Promise((ok,no)=>{const q=indexedDB.open('hlm-phase11-isolated-franchise-atomic-v1');q.onerror=()=>no(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction(['records','commands'],'readonly'),r=tx.objectStore('records').getAll(),c=tx.objectStore('commands').getAll();tx.oncomplete=()=>{db.close();ok(JSON.stringify({records:r.result,commands:c.result}))}}}));
   const ready=()=>p.waitForFunction(()=>document.querySelector('#transactional-save-status').textContent.includes('ready'));
   async function activate(id,keyboard=false){const b=p.locator('#'+id);if(keyboard){await b.focus();await p.keyboard.press('Enter')}else if(width<500)await b.tap();else await b.click()}
   async function feedback(id,pattern){const r=p.locator('#'+id);assert.match(await r.textContent(),pattern);assert.equal(await p.evaluate(()=>document.activeElement.id),id);const box=await r.boundingBox();assert.ok(box&&box.y>=0&&box.y<844,'report in viewport');assert.equal(await r.isVisible(),true);assert.equal(await r.getAttribute('tabindex'),'-1');}
   await p.goto(entry);await ready();assert.equal(await p.locator('#a1-nav').count(),0);assert.equal(await record(),null);
   await p.goto(entry+'?a22Navigation=1');await p.waitForFunction(()=>!document.querySelector('#new-franchise').disabled);await p.evaluate(()=>location.hash='file');await p.selectOption('#new-team','24');p.once('dialog',d=>d.accept());await activate('new-franchise');await p.waitForFunction(()=>document.querySelector('#new-status').textContent.startsWith('Created'));
   const created=await record();assert.equal(JSON.parse(created.payloadText).meta.controlledTeamId,24);await p.click('[data-a1-tab="season"]');
   const noApproval=await allSaved(),beforePuts=await p.evaluate(()=>controlPuts);await activate('gm-workspace-review');await feedback('gm-game-day-approval-status',/First approve your skater deployment/);assert.equal(await p.locator('#gm-game-day-approve').isDisabled(),true);assert.equal(await allSaved(),noApproval);assert.equal(await p.evaluate(()=>controlPuts),beforePuts);
   await p.click('[data-a1-tab="roster"]');const ids=await p.locator('#gm-skater-choice option').evaluateAll(xs=>xs.slice(0,3).map(x=>x.value));assert.equal(ids.length,3);await p.selectOption('#gm-skater-choice',ids);await activate('gm-skater-review');p.once('dialog',d=>d.accept());await activate('gm-skater-approve');await p.waitForFunction(async()=>{const r=await HLMIsolatedAtomicSave.create({indexedDB}).read();return r?.revision===2&&!document.querySelector('#transactional-save-status').textContent.startsWith('Saving')});
   const approved=await record(),state=JSON.parse(approved.payloadText);assert.deepEqual(state.extensions.phase11GmApprovedSkaters.playerIds.map(String),ids);assert.equal(state.activity.games.some(g=>g.status==='final'),false);await p.reload();await ready();assert.deepEqual(await record(),approved);await p.click('[data-a1-tab="season"]');
   const game=state.activity.games.find(g=>g.status==='scheduled'&&(String(g.homeTeamId)==='24'||String(g.awayTeamId)==='24'));await p.selectOption('#game',String(game.id));const immutable=await allSaved(),writes=await p.evaluate(()=>controlPuts);let dialogs=0;p.on('dialog',async d=>{dialogs++;await d.dismiss()});
   for(const keyboard of [false,true]){
    await activate('gm-workspace-preview',keyboard);await feedback('gm-selected-game-preview-report',/READ-ONLY GM GAME PREVIEW/);assert.ok((await p.textContent('#gm-selected-game-preview-report')).includes(game.id));assert.equal(await allSaved(),immutable);
    await activate('gm-workspace-review',keyboard);await feedback('gm-game-day-approval-status',/Reviewed 3 skaters/);assert.equal(await p.locator('#gm-game-day-approve').isEnabled(),true);assert.equal(await allSaved(),immutable);assert.equal(dialogs,0);
   }
   // The original controls share the same feedback path; no pointer-only handler is needed.
   await activate('gm-selected-game-preview',true);await feedback('gm-selected-game-preview-report',/No simulation, approval or save occurred/);await activate('gm-game-day-review',true);await feedback('gm-game-day-approval-status',/Human GM approval required/);
   await activate('gm-workspace-approve');assert.equal(dialogs,1);assert.equal(await allSaved(),immutable);assert.equal(await p.evaluate(()=>controlPuts),writes);
   await p.evaluate(()=>{document.querySelector('#game').value='';document.querySelector('#game').dispatchEvent(new Event('change',{bubbles:true}))});await activate('gm-workspace-preview');await feedback('gm-selected-game-preview-report',/Preview unavailable: No scheduled game selected/);assert.equal(await allSaved(),immutable);
   await p.reload();await ready();assert.deepEqual(await record(),approved);assert.equal(await allSaved(),immutable);assert.equal(await p.evaluate(()=>controlPuts),0);assert.equal(await p.evaluate(()=>simulationClicks),0);assert.equal(await p.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'A2108_PRODUCTION_SENTINEL');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   // Without opt-in, the existing legacy presentation keeps its original focus behavior.
   await p.goto(entry);await ready();assert.equal(await p.locator('#a1-nav').count(),0);await activate('gm-selected-game-preview');assert.equal(await p.evaluate(()=>document.activeElement.id),'gm-selected-game-preview');assert.equal(await allSaved(),immutable);
  }finally{await c.close()}
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({suite:'A2-108 game-day control feedback',passed:assertions,failed:0,seconds:(performance.now()-started)/1000,viewports:[360,390,1280],errors,simulation:'No games simulated; only disposable franchise creation and explicit three-skater approval committed'}));
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1});
