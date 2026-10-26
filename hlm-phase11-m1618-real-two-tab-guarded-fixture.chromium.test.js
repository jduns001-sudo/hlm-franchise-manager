'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(err,data)=>err?res.writeHead(404).end():res.writeHead(200,{'content-type':name.endsWith('.js')?'application/javascript':name.endsWith('.json')?'application/json':'text/html'}).end(data))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const url='http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html';
const tabA=await context.newPage();await tabA.goto(url);await tabA.waitForFunction(()=>document.querySelector('#new-franchise')&&!document.querySelector('#new-franchise').disabled,null,{timeout:30000});
await tabA.evaluate(()=>localStorage.setItem('hlm_front_office_v8','M1618_PRODUCTION_SENTINEL'));
await tabA.locator('#new-team').selectOption('5');tabA.once('dialog',d=>d.accept());await tabA.locator('#new-franchise').click();
await tabA.waitForFunction(()=>{try{return !!HLMIsolatedSingleGame.create(HLMPhase10,localStorage).peek()}catch{return false}},null,{timeout:30000});
const key='hlm-phase11-m1340-isolated-single-game-v1';
const seeded=await tabA.evaluate(()=>{const manager=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);let state=manager.peek();for(let i=0;i<90;i++){const gm=String(state.meta.controlledTeamId),games=state.activity.games;const finals=games.filter(g=>g.status==='final'&&[g.homeTeamId,g.awayTeamId].map(String).includes(gm));for(const prior of finals){const next=games.filter(g=>g.status==='scheduled'&&String(g.date)>String(prior.date)&&[g.homeTeamId,g.awayTeamId].map(String).includes(gm)).sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0];if(next){const fixtures=games.filter(g=>g.status==='scheduled'&&String(g.date)>=String(prior.date)&&String(g.date)<=String(next.date)&&String(g.id)!==String(next.id));if(fixtures.length)return {prior:String(prior.id),fixture:String(fixtures[0].id),seededDays:i}}}if(!games.some(g=>g.status==='scheduled'))break;manager.advanceNextDay(161800+i,true);state=manager.peek()}throw Error('No source-backed final/CPU blocker/next GM game found within 90 guarded days')});
const baseline=await tabA.evaluate(k=>localStorage.getItem(k),key);
const tabB=await context.newPage();await tabB.goto(url);await tabB.waitForFunction(()=>typeof HLMIsolatedSingleGame==='object');
const setup=await tabA.evaluate(prior=>{const priorInput=document.getElementById('gm-m1603-prior');const select=document.getElementById('gm-m1608-select');const refresh=document.getElementById('gm-m1608-blocker-refresh');if(!priorInput||!select||!refresh)throw Error('Shipped CPU fixture review UI unavailable');priorInput.value=prior;refresh.click();return {count:select.options.length}},seeded.prior);
assert.ok(setup.count>1,'real-universe CPU fixture must be selectable');
await tabA.locator('#gm-m1608-select').selectOption(seeded.fixture);await tabA.locator('#gm-m1608-review').click();assert.equal(await tabA.locator('#gm-m1611-day-handoff').isEnabled(),true);
await tabA.locator('#gm-m1611-day-handoff').click();assert.equal(await tabA.locator('#gm-m1612-fixture-context').count(),1);
assert.equal(await tabA.evaluate(k=>localStorage.getItem(k),key),baseline,'GM review and handoff must not save');
const event=tabA.evaluate(k=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('No genuine cross-tab storage event')),15000);window.addEventListener('storage',e=>{if(e.key===k){clearTimeout(timeout);resolve({key:e.key,changed:e.oldValue!==e.newValue})}},{once:true})}),key);
const mutation=await tabB.evaluate(()=>{const manager=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);const before=localStorage.getItem(manager.key);const result=manager.advanceNextDay(161899,true);return {changed:before!==localStorage.getItem(manager.key),toDate:result.toDate}});
assert.equal(mutation.changed,true,'Tab B must commit a guarded, GM-approved isolated save');assert.deepEqual(await event,{key,changed:true});
await tabA.waitForFunction(()=>document.querySelector('#gm-m1611-day-handoff')?.disabled===true&&document.querySelector('#gm-m1608-select')?.options.length===0);
assert.equal(await tabA.locator('#gm-m1612-fixture-context').count(),0,'real storage event invalidates stale handoff');
await tabA.locator('#gm-m1611-day-handoff').click({force:true});assert.equal(await tabA.locator('#gm-m1612-fixture-context').count(),0,'stale handoff must not reappear');
const winner=await tabB.evaluate(k=>localStorage.getItem(k),key);
assert.equal(await tabA.evaluate(k=>localStorage.getItem(k),key),winner,'stale tab must not overwrite authoritative save');
await tabA.locator('#gm-m1608-blocker-refresh').click();
const remaining=await tabA.locator('#gm-m1608-select option').evaluateAll(options=>options.filter(o=>o.value).map(o=>o.value));
if(remaining.length){await tabA.locator('#gm-m1608-select').selectOption(remaining[0]);await tabA.locator('#gm-m1608-review').click();assert.equal(await tabA.locator('#gm-m1611-day-handoff').isEnabled(),true,'fresh explicit review restores handoff');}
assert.equal(await tabA.evaluate(k=>localStorage.getItem(k),key),winner,'refresh and re-review must not save');
await tabA.reload();assert.equal(await tabA.locator('#gm-m1612-fixture-context').count(),0,'reload must not resurrect stale context');
assert.equal(await tabA.evaluate(k=>localStorage.getItem(k),key),winner,'reload must preserve authoritative save');
for(const tab of [tabA,tabB])assert.equal(await tab.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'M1618_PRODUCTION_SENTINEL');
console.log('Mission 1618 genuine two-tab guarded mutation, stale review invalidation, explicit re-review, reload, no-save, production isolation PASS',seeded);
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(err=>{console.error(err);process.exitCode=1});
