'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
function source(){return {schemaVersion:1,meta:{revision:1,controlledTeamId:'A'},universe:{players:[{id:'pA',teamId:'A'},{id:'pB',teamId:'B'}],teams:[{id:'A'},{id:'B'}],leagues:[],prospects:[],staff:[]},assets:{contracts:[{playerId:'pA',teamId:'A',status:'active',aav:4,tradePermission:'allowed'},{playerId:'pB',teamId:'B',status:'active',aav:7,tradePermission:'allowed'}],draftPicks:[]},activity:{transactions:[],games:[],injuries:[]},history:{seasons:[],statistics:[],records:[]},finances:{teamCapLimits:{A:100,B:100}},extensions:{tradeRosterLimits:{A:30,B:30}}}}
const database='hlm-phase11-m1567-experimental-mobile';
async function snapshot(page){return page.evaluate(async name=>{
 const db=await new Promise((resolve,reject)=>{const request=indexedDB.open(name,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly');let game,ledger;tx.objectStore('records').get('game').onsuccess=e=>game=e.target.result;tx.objectStore('records').get('ledger').onsuccess=e=>ledger=e.target.result;tx.oncomplete=()=>resolve({game,ledger});tx.onabort=()=>reject(tx.error)})}finally{db.close()}
},database)}
async function connect(page){
 await page.locator('#franchise').selectOption(database);await page.locator('#authorize').check();await page.locator('#connect').click();
 await page.waitForFunction(()=>document.getElementById('connection-status').textContent.startsWith('Connected'));
 await page.waitForFunction(()=>document.getElementById('roster-status').textContent.startsWith('Saved roster revision'));
}
(async()=>{
 const allowed=new Set(['hlm-phase11-m1567-experimental-trade-entry.html','hlm-phase11-m1567-trade-entry.js','hlm-phase11-m1567-trade-browser.js','hlm-phase11-m1524-gm-trade-review.html']);
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1);
  if(!allowed.has(name)){res.writeHead(404);res.end();return}
  res.writeHead(200,{'content-type':name.endsWith('.js')?'text/javascript':'text/html'});res.end(fs.readFileSync(path.join(__dirname,name)));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage(),url='http://127.0.0.1:'+server.address().port+'/hlm-phase11-m1567-experimental-trade-entry.html';
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(()=>document.getElementById('connection-status').textContent.startsWith('No existing experimental'));
  assert.equal(await page.locator('#connect').isDisabled(),true);
  assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[],'entry must not create storage');
  await page.evaluate(async ({state,name})=>{
   localStorage.setItem('hlm_front_office_v8','untouched');
   const db=await new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>req.result.createObjectStore('records');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
   try{await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put(state,'game');tx.objectStore('records').put({revision:1,events:[{id:'seed',experimental:true}]},'ledger');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})}finally{db.close()}
  },{state:(()=>{const state=source();state.universe.players[0].name='Alex Source';state.universe.players[1].name='Blair Source';return state})(),name:database});
  await page.reload();await page.waitForFunction(()=>!document.getElementById('franchise').disabled);
  const before=await snapshot(page);
  const trade=page.frameLocator('#trade-frame');
  await trade.locator('#outgoing').fill('pA');await trade.locator('#incoming').fill('pB');await trade.locator('#review').click();
  assert.match(await trade.locator('#status').innerText(),/No source-backed review host/);
  await page.locator('#franchise').selectOption(database);assert.equal(await page.locator('#connect').isDisabled(),true);
  await connect(page);assert.deepEqual(await snapshot(page),before,'connection never writes');
  assert.match(await page.locator('#trade-history').innerText(),/No recorded experimental player trades/);
  assert.match(await page.locator('#outgoing-player').innerText(),/Alex Source/);
  assert.match(await page.locator('#incoming-player').innerText(),/Blair Source/);
  await page.locator('#outgoing-player').selectOption('pA');await page.locator('#incoming-player').selectOption('pB');
  await trade.locator('#review').click();
  await page.waitForFunction(()=>document.getElementById('trade-frame').contentDocument.getElementById('terms').textContent.startsWith('Reviewed saved revision 1'));
  assert.match(await trade.locator('#terms').innerText(),/You send: Alex Source \(pA\)/);
  assert.match(await trade.locator('#terms').innerText(),/You receive: Blair Source \(pB\)/);
  assert.match(await trade.locator('#terms').innerText(),/A: payroll 4 → 7; cap limit 100; remaining cap 93/);
  assert.match(await trade.locator('#terms').innerText(),/B: payroll 7 → 4; cap limit 100; remaining cap 96/);
  await trade.locator('#approve').check();
  await page.locator('#incoming-player').selectOption('');
  assert.equal(await trade.locator('#terms').innerText(),'No trade terms reviewed.');
  assert.equal(await trade.locator('#submit').isDisabled(),true,'changed selection invalidates financial review and approval');
  await page.locator('#incoming-player').selectOption('pB');
  await trade.locator('#review').click();await trade.locator('#approve').check();await trade.locator('#decline').click();
  assert.equal(await trade.locator('#terms').innerText(),'No trade terms reviewed.');
  assert.deepEqual(await snapshot(page),before,'decline never saves');
  const other=await context.newPage();await other.goto(url);await other.waitForFunction(()=>!document.getElementById('franchise').disabled);await connect(other);
  const stale=other.frameLocator('#trade-frame');
  await other.locator('#outgoing-player').selectOption('pA');await other.locator('#incoming-player').selectOption('pB');await stale.locator('#review').click();await stale.locator('#approve').check();
  await trade.locator('#review').click();await trade.locator('#approve').check();
  // Keep a real IndexedDB transaction open so pending controls can be observed.
  await page.evaluate(async name=>{
   window.__releaseTradeLock=false;
   const db=await new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
   const tx=db.transaction('records','readwrite'),store=tx.objectStore('records');
   function keepAlive(){store.get('game').onsuccess=()=>{if(!window.__releaseTradeLock)keepAlive()}}keepAlive();
   tx.oncomplete=()=>db.close();tx.onabort=()=>db.close();
  },database);
  await trade.locator('#submit').click();
  assert.equal(await page.locator('#outgoing-player').isDisabled(),true);
  assert.equal(await page.locator('#incoming-player').isDisabled(),true);
  assert.equal(await page.locator('#refresh-players').isDisabled(),true);
  await page.evaluate(()=>{window.__releaseTradeLock=true});
  await page.waitForFunction(()=>document.getElementById('trade-frame').contentDocument.getElementById('status').textContent.startsWith('Experimental synthetic transaction saved'));
  const stored=await snapshot(page);assert.equal(stored.game.meta.revision,2);assert.equal(stored.ledger.events.length,2);
  assert.equal(stored.game.activity.transactions.length,1,'ownership and transaction history commit together');
  const transaction=stored.game.activity.transactions[0];
  assert.equal(transaction.id,stored.ledger.events[1].id);
  assert.equal(transaction.revision,2);assert.equal(transaction.productionSettlementAuthorized,false);
  assert.match(await page.locator('#trade-history').innerText(),/Refresh saved rosters/);
  await page.locator('#refresh-players').click();
  await page.waitForFunction(()=>document.getElementById('roster-status').textContent.startsWith('Saved roster revision 2'));
  const savedHistory=await page.locator('#trade-history').innerText();
  assert.match(savedHistory,/Saved revision 2/);
  assert.match(savedHistory,/Alex Source \(pA\): A → B; annual cap charge 4/);
  assert.match(savedHistory,/Blair Source \(pB\): B → A; annual cap charge 7/);
  assert.equal(await page.locator('#trade-history img').count(),0);
  assert.match(await page.locator('#outgoing-player').innerText(),/Blair Source/);
  assert.doesNotMatch(await page.locator('#outgoing-player').innerText(),/Alex Source/);
  assert.match(await page.locator('#incoming-player').innerText(),/Alex Source/);
  assert.equal(stored.game.universe.players[0].teamId,'B');assert.equal(stored.game.assets.contracts[0].teamId,'B');
  assert.equal(stored.game.universe.players[1].teamId,'A');assert.equal(stored.game.assets.contracts[1].teamId,'A');
  await stale.locator('#submit').click();await other.waitForFunction(()=>document.getElementById('trade-frame').contentDocument.getElementById('status').textContent.startsWith('Settlement blocked'));
  assert.deepEqual(await snapshot(page),stored,'stale browser tab never saves');
  await page.reload();await page.waitForFunction(()=>!document.getElementById('franchise').disabled);
  assert.equal(await page.locator('#authorize').isChecked(),false);assert.equal(await page.locator('#connect').isDisabled(),true);
  assert.deepEqual(await snapshot(page),stored,'persisted franchise survives real reload');
  await connect(page);
  assert.equal(await page.locator('#trade-history').innerText(),savedHistory,'committed trade history survives reconnect and reload');
  await page.locator('#outgoing-player').selectOption('pB');await page.locator('#incoming-player').selectOption('pA');await trade.locator('#review').click();
  await page.waitForFunction(()=>document.getElementById('trade-frame').contentDocument.getElementById('summary').textContent.includes('cpu-policy-declined'));
  assert.equal(await trade.locator('#approve').isDisabled(),true);
  assert.equal(await trade.locator('#terms').innerText(),'No trade terms reviewed.','blocked review never reuses old financial terms');
  assert.deepEqual(await snapshot(page),stored);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'untouched');
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),['hlm_front_office_v8']);assert.deepEqual(errors,[]);
  console.log('M1568 source player selectors: read-only roster, pending controls, post-trade ownership refresh, two-tab rejection and reload passed');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
