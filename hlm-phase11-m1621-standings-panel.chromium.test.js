'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(err,data)=>err?res.writeHead(404).end():res.writeHead(200,{'content-type':name.endsWith('.js')?'application/javascript':name.endsWith('.json')?'application/json':'text/html'}).end(data))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const url='http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html';
 const tabA=await context.newPage();await tabA.goto(url);await tabA.waitForFunction(()=>document.querySelector('#new-franchise')&&!document.querySelector('#new-franchise').disabled,null,{timeout:30000});
 await tabA.evaluate(()=>localStorage.setItem('hlm_front_office_v8','M1621_PRODUCTION_SENTINEL'));
 await tabA.locator('#new-team').selectOption('5');tabA.once('dialog',d=>d.accept());await tabA.locator('#new-franchise').click();
 await tabA.waitForFunction(()=>document.querySelector('#gm-m1621-status')?.textContent.includes('source teams'));
 const key='hlm-phase11-m1340-isolated-single-game-v1';
 const baseline=await tabA.evaluate(k=>localStorage.getItem(k),key);
 const expected=await tabA.evaluate(()=>{const s=HLMIsolatedSingleGame.create(HLMPhase10,localStorage).peek();return HLMPhase10.calculateStandings(s.universe.teams,s.activity.games)});
 const displayed=await tabA.locator('#gm-m1621-table li').allTextContents();
 assert.equal(displayed.length,expected.length,'real universe teams must all appear');
 for(let i=0;i<expected.length;i++)assert.ok(displayed[i].includes('PTS '+expected[i].points),'authoritative points');
 await tabA.locator('#gm-m1621-refresh').click();
 assert.equal(await tabA.evaluate(k=>localStorage.getItem(k),key),baseline,'refresh must not save');
 const tabB=await context.newPage();await tabB.goto(url);
 await tabB.evaluate(()=>{const m=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);m.advanceNextDay(162101,true)});
 await tabA.waitForFunction(()=>document.querySelector('#gm-m1621-status')?.textContent.includes('Another tab changed'));
 assert.equal(await tabA.locator('#gm-m1621-table li').count(),0,'stale standings cleared');
 assert.equal(await tabA.locator('#gm-m1621-results li').count(),0,'stale results cleared');
 await tabA.locator('#gm-m1621-refresh').click();
 assert.equal(await tabA.locator('#gm-m1621-table li').count(),0,'stale refresh must not silently revive view');
 await tabA.reload();await tabA.waitForFunction(()=>document.querySelector('#gm-m1621-status')?.textContent.includes('source teams'));
 const state=await tabA.evaluate(()=>HLMIsolatedSingleGame.create(HLMPhase10,localStorage).peek());
 const projected=await tabA.evaluate(()=>HLMSourceStandings.project(HLMIsolatedSingleGame.create(HLMPhase10,localStorage).peek(),HLMPhase10));
 assert.equal(projected.results.length,state.activity.games.filter(g=>g.status==='final').length,'source finals only');
 assert.deepEqual(projected.standings,state.activity.standings||HLMPhase10.calculateStandings(state.universe.teams,state.activity.games),'authoritative standings parity');
 const after=await tabA.evaluate(k=>localStorage.getItem(k),key);
 await tabA.locator('#gm-m1621-refresh').click();assert.equal(await tabA.evaluate(k=>localStorage.getItem(k),key),after,'reload refresh no-save');
 for(const tab of [tabA,tabB])assert.equal(await tab.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'M1621_PRODUCTION_SENTINEL');
 console.log('Mission 1621 real-universe mobile standings, read-only refresh, stale-tab invalidation, reload and production isolation PASS');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
