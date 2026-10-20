'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  for(const file of ['hlm-phase11-isolated-single-game.html','hlm-phase10-browser.bundle.js','hlm-phase11-isolated-single-game.js']){
   await page.route('**/'+file+'*',route=>route.fulfill({status:200,contentType:file.endsWith('.html')?'text/html':'application/javascript',body:fs.readFileSync(file,'utf8')}));
  }
  await page.goto('https://jduns001-sudo.github.io/hlm-franchise-manager/hlm-phase11-isolated-single-game.html?mission1396='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','MISSION1396_PRODUCTION_SENTINEL'));
  await page.waitForFunction(()=>document.querySelector('#new-team')?.options.length===32&&!document.querySelector('#new-franchise')?.disabled,{timeout:60000});
  await page.locator('#new-team').selectOption('5');
  page.once('dialog',d=>d.accept());
  await page.locator('#new-franchise').click();
  await page.waitForFunction(()=>document.querySelector('#gm-roster')?.textContent.includes('Players:'),{timeout:60000});
  const key='hlm-phase11-m1340-isolated-single-game-v1';
  await page.evaluate(key=>{const state=JSON.parse(localStorage.getItem(key));state.universe.prospects.push({id:'mission1396-prospect',name:'Unsigned Prospect',position:'C',overall:70,draftedByTeamId:5,draftPickId:'mission1396-pick'});state.assets.draftPicks.push({pickId:'mission1396-pick',currentOwnerId:5,selectedProspectId:'mission1396-prospect',status:'used'});localStorage.setItem(key,JSON.stringify(state))},key);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#prospect-sign-select')?.options.length===1,{timeout:60000});
  assert.match(await page.locator('#gm-roster').innerText(),/Draft rights: 1/);
  const before=await page.evaluate(key=>localStorage.getItem(key),key);
  await page.locator('#prospect-sign-review').click();
  assert.match(await page.locator('#prospect-sign-status').innerText(),/Human GM approval required/);
  page.once('dialog',d=>d.dismiss());
  await page.locator('#prospect-sign-approve').click();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before,'cancel never saves');
  page.once('dialog',d=>d.accept());
  await page.locator('#prospect-sign-approve').click();
  await page.waitForFunction(()=>document.querySelector('#prospect-sign-status')?.textContent.includes('signed and saved'),{timeout:60000});
  const after=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
  assert.equal(after.universe.players.find(p=>p.id==='mission1396-prospect').teamId,5);
  assert.equal(after.assets.contracts.find(c=>c.contractId==='rookie-contract-1').playerId,'mission1396-prospect');
  assert.equal(after.activity.transactions.filter(t=>t.type==='drafted-prospect-signing').length,1,'one signed transaction');
  assert.equal(after.activity.transactions.find(t=>t.type==='drafted-prospect-signing').contractId,'rookie-contract-1');
  assert.match(await page.locator('#gm-signing-history').innerText(),/rookie-contract-1/);
  assert.equal(after.extensions.phase11ExperimentalRosterAwareScores,false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1396_PRODUCTION_SENTINEL');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#gm-roster')?.textContent.includes('Unsigned Prospect'),{timeout:60000});
  assert.equal(await page.locator('#prospect-sign-review').isDisabled(),true,'cannot sign twice');
  assert.match(await page.locator('#gm-signing-history').innerText(),/rookie-contract-1/);
  assert.equal(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)).activity.transactions.filter(t=>t.type==='drafted-prospect-signing').length,1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'MISSION1396_PRODUCTION_SENTINEL');
  console.log('Mission 1396 mobile GM review, cancel, approve, roster, reload and isolation passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
