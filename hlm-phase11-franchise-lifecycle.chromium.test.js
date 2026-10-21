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
 console.log('Mission 1432 two GM-approved real-universe days, second-day cancel and reload passed');
 console.log('Mission 1431 GM-approved real-universe regular-season day and reload continuity passed');
 console.log('Mission 1429 real-universe mobile new franchise, cancel, reload, lineup review, day review and production isolation passed');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}})().catch(e=>{console.error(e);process.exitCode=1});
