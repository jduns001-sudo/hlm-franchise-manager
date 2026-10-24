'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),source=require('./hlm-phase11-m1571-multitrade.fixture');
const database='hlm-phase11-m1571-experimental-mobile';
async function snapshot(page){return page.evaluate(async name=>{
 const db=await new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly');let game,ledger;
  tx.objectStore('records').get('game').onsuccess=e=>game=e.target.result;
  tx.objectStore('records').get('ledger').onsuccess=e=>ledger=e.target.result;
  tx.oncomplete=()=>resolve({game,ledger});tx.onabort=()=>reject(tx.error);
 })}finally{db.close()}
},database)}
async function connect(page){
 await page.waitForFunction(()=>!document.getElementById('franchise').disabled);
 await page.locator('#franchise').selectOption(database);await page.locator('#authorize').check();await page.locator('#connect').click();
 await page.waitForFunction(()=>document.getElementById('roster-status').textContent.startsWith('Saved roster revision'));
}
async function review(page,outgoing,incoming,revision){
 await page.locator('#outgoing-player').selectOption(outgoing);await page.locator('#incoming-player').selectOption(incoming);
 const frame=page.frameLocator('#trade-frame');await frame.locator('#review').click();
 await page.waitForFunction(expected=>document.getElementById('trade-frame').contentDocument.getElementById('terms').textContent.startsWith('Reviewed saved revision '+expected),revision);
 await frame.locator('#approve').check();return frame;
}
async function submit(page,frame,revision){
 await frame.locator('#submit').click();
 await page.waitForFunction(()=>document.getElementById('trade-frame').contentDocument.getElementById('status').textContent.startsWith('Experimental synthetic transaction saved'));
 await page.locator('#refresh-players').click();
 await page.waitForFunction(expected=>document.getElementById('roster-status').textContent.startsWith('Saved roster revision '+expected),revision);
}
(async()=>{
 const allowed=new Set(['hlm-phase11-m1567-experimental-trade-entry.html','hlm-phase11-m1567-trade-entry.js','hlm-phase11-m1567-trade-browser.js','hlm-phase11-m1524-gm-trade-review.html']);
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1);
  if(!allowed.has(name)){res.writeHead(404);res.end();return}
  res.writeHead(200,{'content-type':name.endsWith('.js')?'text/javascript':'text/html'});res.end(fs.readFileSync(path.join(__dirname,name)));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.address().port+'/hlm-phase11-m1567-experimental-trade-entry.html';
  await page.goto(url);
  await page.waitForFunction(()=>document.getElementById('connection-status').textContent.startsWith('No existing experimental'));
  assert.deepEqual(await page.evaluate(()=>indexedDB.databases()),[],'entry never auto-seeds');
  await page.evaluate(async ({state,name})=>{
   localStorage.setItem('hlm_front_office_v8','untouched');
   const db=await new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>req.result.createObjectStore('records');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
   try{await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put(state,'game');tx.objectStore('records').put({revision:1,events:[{id:'seed',experimental:true}]},'ledger');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})}finally{db.close()}
  },{state:source(),name:database});
  await page.reload();await connect(page);
  const seed=await snapshot(page),firstFrame=await review(page,'pA','pB',1);
  assert.deepEqual(await snapshot(page),seed,'first review never saves');
  assert.match(await firstFrame.locator('#terms').innerText(),/Alpha: payroll 4 → 7/);
  await submit(page,firstFrame,2);const first=await snapshot(page);
  assert.equal(first.game.activity.transactions.length,1);assert.equal(first.ledger.events.length,2);
  const firstRecord=first.game.activity.transactions[0];
  await page.reload();assert.equal(await page.locator('#authorize').isChecked(),false);
  await connect(page);assert.match(await page.locator('#trade-history').innerText(),/Saved revision 2/);
  assert.deepEqual(await snapshot(page),first,'reload and reconnect preserve first trade');
  const secondFrame=await review(page,'pB','pC',2);
  assert.match(await secondFrame.locator('#terms').innerText(),/Alpha: payroll 7 → 9/);
  assert.match(await secondFrame.locator('#terms').innerText(),/Gamma: payroll 9 → 7/);
  await secondFrame.locator('#decline').click();assert.deepEqual(await snapshot(page),first,'second decline preserves first history');
  const stale=await context.newPage();await stale.goto(url);await connect(stale);
  const staleFrame=await review(stale,'pB','pC',2);
  await review(page,'pB','pC',2);await submit(page,secondFrame,3);
  const final=await snapshot(page);assert.equal(final.game.meta.revision,3);
  assert.equal(final.game.activity.transactions.length,2);assert.equal(final.ledger.events.length,3);
  assert.deepEqual(final.game.activity.transactions[0],firstRecord,'second trade preserves original receipt');
  assert.deepEqual(final.game.universe.players.map(p=>[p.id,p.teamId]),[['pA','B'],['pB','C'],['pC','A']]);
  assert.deepEqual(final.game.assets.contracts.map(c=>[c.playerId,c.teamId,c.aav]),[['pA','B',4],['pB','C',7],['pC','A',9]]);
  const history=await page.locator('#trade-history').innerText();
  assert.ok(history.indexOf('Saved revision 3')<history.indexOf('Saved revision 2'),'newest committed trade appears first');
  assert.match(history,/Blair \(pB\): Alpha → Gamma/);assert.match(history,/Casey \(pC\): Gamma → Alpha/);
  await staleFrame.locator('#submit').click();
  await stale.waitForFunction(()=>document.getElementById('trade-frame').contentDocument.getElementById('status').textContent.startsWith('Settlement blocked'));
  assert.deepEqual(await snapshot(page),final,'stale second submission adds no third receipt');
  await page.reload();await connect(page);
  assert.equal(await page.locator('#trade-history').innerText(),history,'both records survive final reload');
  assert.deepEqual(await snapshot(page),final);
  await page.locator('#outgoing-player').selectOption('pC');await page.locator('#incoming-player').selectOption('pA');
  await page.frameLocator('#trade-frame').locator('#review').click();
  await page.waitForFunction(()=>document.getElementById('trade-frame').contentDocument.getElementById('summary').textContent.includes('cpu-policy-declined'));
  assert.equal(await page.frameLocator('#trade-frame').locator('#approve').isDisabled(),true);
  assert.deepEqual(await snapshot(page),final,'next CPU decline preserves both trades');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'untouched');
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),['hlm_front_office_v8']);assert.deepEqual(errors,[]);
  console.log('M1571 real mobile UI: two approved trades across three teams, financial impact, history, reload, decline, stale rejection and production isolation passed');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
