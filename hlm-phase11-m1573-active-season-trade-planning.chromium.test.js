'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));
  if(!/^[\w.-]+$/.test(name)){res.writeHead(404).end();return}
  fs.readFile(path.join(__dirname,name),(e,data)=>{if(e){res.writeHead(404).end();return}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(data)});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage(),url='http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html';
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.getElementById('new-franchise').disabled);
  assert.equal(await page.locator('#season-trade-review').isDisabled(),true);
  assert.equal(await page.locator('.gm-command-dock a[href="#gm-season-trade"]').count(),1);
  await page.evaluate(async()=>{
   localStorage.setItem('hlm_front_office_v8','PRODUCTION_LOCAL_SENTINEL');
   const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('hlm_front_office_v8',1);req.onupgradeneeded=()=>req.result.createObjectStore('state');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
   try{await new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({schema:7,sentinel:'PRODUCTION_IDB_SENTINEL'},'db');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})}finally{db.close()}
  });
  await page.locator('#new-team').selectOption('5');
  page.once('dialog',d=>d.dismiss());await page.locator('#new-franchise').click();
  assert.equal(await page.locator('#season-trade-review').isDisabled(),true,'cancelled franchise creation enables no trade source');
  page.once('dialog',d=>d.accept());await page.locator('#new-franchise').click();
  await page.waitForFunction(()=>document.getElementById('season-trade-outgoing').options.length>1);
  const key='hlm-phase11-m1340-isolated-single-game-v1';
  const before=await page.evaluate(k=>localStorage.getItem(k),key),state=JSON.parse(before);
  const owner=String(state.meta.controlledTeamId),own=state.universe.players.filter(p=>String(p.teamId)===owner);
  assert.equal(owner,'5');assert.equal(state.assets.contracts.length,0);
  assert.equal(await page.locator('#season-trade-outgoing option').count(),own.length+1);
  const choices=await page.locator('#season-trade-incoming option').evaluateAll(options=>options.map(o=>o.value).filter(Boolean));
  assert.ok(choices.length>100);assert.ok(choices.every(id=>state.universe.players.some(p=>String(p.id)===id&&String(p.teamId)!==owner)));

  // M1577: the real saved-season roster has no source contracts.
  await page.locator('#season-evidence-board-refresh').click();
  await page.waitForFunction(()=>document.getElementById('season-evidence-board-report').textContent.includes('Publisher authenticated: NO'));
  assert.match(await page.locator('#season-evidence-board-report').innerText(),/missing active contracts/);
  assert.match(await page.locator('#season-evidence-board-report').innerText(),/team cap unavailable/);
  assert.match(await page.locator('#season-evidence-board-report').innerText(),/Trading authorized: NO/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'readiness report cannot persist');
  await page.locator('#season-evidence-board-decline').click();
  assert.match(await page.locator('#season-evidence-board-report').innerText(),/review declined/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'declined readiness report no-save');
  await page.locator('#season-evidence-board-refresh').click();


  // M1578 real saved-season integration requirements never grant import or settlement.
  await page.locator('#season-contract-requirements-refresh').click();
  await page.waitForFunction(()=>document.getElementById('season-contract-requirements-report').textContent.includes('Publisher authenticated: NO'));
  assert.match(await page.locator('#season-contract-requirements-report').innerText(),/No independently authenticated contract publisher/);
  assert.match(await page.locator('#season-contract-requirements-report').innerText(),/missing active contracts/);
  assert.match(await page.locator('#season-contract-requirements-report').innerText(),/Contracts imported: NO \| Trades authorized: NO/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'integration requirements never save');
  await page.locator('#season-contract-requirements-decline').click();
  assert.match(await page.locator('#season-contract-requirements-report').innerText(),/review declined/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'declined requirements no-save');
  await page.locator('#season-contract-requirements-refresh').click();

  const outgoing=String(own[0].id),incoming=choices[0];

  // M1575: local document never enters GameState. Even a claimed verified
  // publisher is displayed as untrusted and incomplete for the real roster.
  const otherPlayer=state.universe.players.find(p=>String(p.id)===incoming);
  const external={
   schemaVersion:1,source:{publisher:'Unverified upload',reference:'synthetic-identity-test',asOfDate:'2026-10-24'},
   scope:{teamIds:[own[0].teamId,otherPlayer.teamId]},
   contracts:[
    {contractId:'test-own',playerId:own[0].id,teamId:own[0].teamId,status:'active',aav:1000000,tradePermission:'unknown'},
    {contractId:'test-other',playerId:otherPlayer.id,teamId:otherPlayer.teamId,status:'active',aav:2000000,tradePermission:'unknown'}
   ],sourcePublisherAuthenticated:true,settlementAuthorized:true
  };
  const upload=async data=>page.locator('#season-contract-file').setInputFiles({
   name:'untrusted-contract-reference.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  assert.equal(await page.locator('#season-contract-file').isEnabled(),true);
  await upload(external);await page.locator('#season-contract-review').click();
  await page.waitForFunction(()=>document.getElementById('season-contract-report').textContent.includes('Publisher authenticated: NO'));
  assert.match(await page.locator('#season-contract-report').innerText(),/SHA-256 file fingerprint \(integrity only\): [a-f0-9]{64}/);
  assert.match(await page.locator('#season-contract-report').innerText(),/incomplete or conflicting/);
  assert.match(await page.locator('#season-contract-report').innerText(),/Contracts imported: NO \| Trades authorized: NO/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'external file never changes real season');
  await page.locator('#season-contract-decline').click();
  assert.match(await page.locator('#season-contract-report').innerText(),/evidence discarded/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'discard never saves');
  await page.locator('#season-trade-refresh').click();
  const bad={...external,contracts:[{...external.contracts[0],playerId:'forged-nonexistent-id'}]};
  await upload(bad);await page.locator('#season-contract-review').click();
  await page.waitForFunction(()=>document.getElementById('season-contract-report').textContent.includes('inspection blocked'));
  assert.match(await page.locator('#season-contract-report').innerText(),/player absent/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'invalid evidence never saved');
  await page.locator('#season-trade-refresh').click();
  await upload(external);await page.locator('#season-contract-review').click();
  await page.waitForFunction(()=>document.getElementById('season-contract-report').textContent.includes('Publisher authenticated: NO'));

  async function choose(){await page.locator('#season-trade-outgoing').selectOption(outgoing);await page.locator('#season-trade-incoming').selectOption(incoming);await page.locator('#season-trade-review').click()}
  await choose();
  assert.match(await page.locator('#season-trade-report').innerText(),new RegExp(outgoing));
  assert.match(await page.locator('#season-trade-report').innerText(),/Active contract unavailable from this saved season/);
  assert.match(await page.locator('#season-trade-report').innerText(),/Trade approval and settlement are not connected/);
  assert.match(await page.locator('#season-trade-report').innerText(),/Source-backed trade preflight \(read-only\)/);
  assert.match(await page.locator('#season-trade-report').innerText(),/missing unique active contract evidence/);
  assert.match(await page.locator('#season-trade-report').innerText(),/CPU consent, league restrictions and real-season settlement are not authenticated or enabled/);
  assert.equal(await page.locator('#gm-season-trade [id*=submit], #gm-season-trade [id*=approve]').count(),0);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'actual-season selection and review never write');
  await page.locator('#season-trade-cancel').click();assert.match(await page.locator('#season-trade-report').innerText(),/Declined/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'declining source review never saves');
  await choose();
  const other=await context.newPage();await other.goto(url,{waitUntil:'domcontentloaded'});
  await other.waitForFunction(()=>!document.getElementById('day-review').disabled);
  await other.locator('#day-review').click();other.once('dialog',d=>d.accept());await other.locator('#day-approve').click();
  await other.waitForFunction(()=>document.getElementById('day-report').textContent.startsWith('Persisted isolated day'));
  await page.waitForFunction(()=>document.getElementById('season-trade-report').textContent.includes('another tab'));

  await page.waitForFunction(()=>document.getElementById('season-contract-report').textContent.includes('another tab'));

  await page.waitForFunction(()=>document.getElementById('season-evidence-board-report').textContent.includes('another tab'));
  await page.waitForFunction(()=>document.getElementById('season-contract-requirements-report').textContent.includes('another tab'));
  assert.equal(await page.locator('#season-contract-requirements-decline').isDisabled(),true);

  assert.equal(await page.locator('#season-evidence-board-decline').isDisabled(),true,'cross-tab approval invalidates old report');

  assert.equal(await page.locator('#season-contract-file').isDisabled(),true,'stale tab invalidates external inspection');
  assert.equal(await page.locator('#season-contract-review').isDisabled(),true);

  assert.equal(await page.locator('#season-trade-review').isDisabled(),true,'actual game-day save invalidates previous trade review');
  const advanced=await page.evaluate(k=>localStorage.getItem(k),key);assert.notEqual(advanced,before);
  await page.locator('#season-trade-refresh').click();await choose();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),advanced,'refresh reads the current season without copying or saving it');
  await page.reload();await page.waitForFunction(()=>document.getElementById('season-trade-outgoing').options.length>1);
  assert.equal(await page.locator('#season-trade-review').isDisabled(),true,'reload requires a fresh player selection');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),advanced);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_LOCAL_SENTINEL');
  const production=await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('hlm_front_office_v8',1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
   try{return await new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly');const req=tx.objectStore('state').get('db');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}finally{db.close()}
  });assert.deepEqual(production,{schema:7,sentinel:'PRODUCTION_IDB_SENTINEL'});
  assert.deepEqual((await page.evaluate(()=>indexedDB.databases())).map(d=>d.name),['hlm_front_office_v8'],'planning creates no experimental database or copied franchise');
  assert.deepEqual(errors,[]);
  console.log('M1573 real-universe mobile season: source roster review, absent contracts, cancellation no-save, real cross-tab day advancement, refresh/reload and production IndexedDB isolation passed');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
