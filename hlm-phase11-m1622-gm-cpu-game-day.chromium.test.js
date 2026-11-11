'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{
 const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(err,data)=>err?res.writeHead(404).end():res.writeHead(200,{'content-type':name.endsWith('.js')?'application/javascript':name.endsWith('.json')?'application/json':'text/html'}).end(data))});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const url='http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html';
  const a=await context.newPage();await a.goto(url);
  await a.waitForFunction(()=>document.querySelector('#new-franchise')&&!document.querySelector('#new-franchise').disabled,null,{timeout:30000});
  await a.evaluate(()=>localStorage.setItem('hlm_front_office_v8','M1622_PRODUCTION_SENTINEL'));
  await a.locator('#new-team').selectOption('5');a.once('dialog',d=>d.accept());await a.locator('#new-franchise').click();
  await a.waitForFunction(()=>{try{return !!HLMIsolatedSingleGame.create(HLMPhase10,localStorage).peek()}catch{return false}},null,{timeout:30000});
  const key='hlm-phase11-m1340-isolated-single-game-v1';
  const b=await context.newPage();await b.goto(url);await b.waitForFunction(()=>typeof HLMIsolatedSingleGame==='object');
  const before=await a.evaluate(k=>localStorage.getItem(k),key);
  const decline=await a.evaluate(()=>{const m=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);const baseline=localStorage.getItem(m.key);try{m.advanceNextDay(162200,false);return false}catch(e){return /approval/i.test(String(e))&&localStorage.getItem(m.key)===baseline}});
  assert.equal(decline,true,'GM declined day must not save');
  assert.equal(await a.evaluate(k=>localStorage.getItem(k),key),before);
  const event=a.evaluate(k=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Cross-tab storage event missing')),15000);window.addEventListener('storage',e=>{if(e.key===k){clearTimeout(timer);resolve(e.oldValue!==e.newValue)}},{once:true})}),key);
  const committed=await b.evaluate(()=>{const m=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);const initial=m.peek();const gm=String(initial.meta.controlledTeamId);let result,days=0;for(;days<90;days++){result=m.advanceNextDay(162201+days,true);const s=m.peek();const finals=s.activity.games.filter(g=>g.status==='final');if(finals.some(g=>String(g.homeTeamId)===gm||String(g.awayTeamId)===gm)&&finals.some(g=>String(g.homeTeamId)!==gm&&String(g.awayTeamId)!==gm))break}if(days===90)throw Error('No GM/CPU source-backed finals in 90 days');const s=m.peek();return {days,gm,finals:s.activity.games.filter(g=>g.status==='final').map(g=>({id:String(g.id),date:g.date,homeTeamId:String(g.homeTeamId),awayTeamId:String(g.awayTeamId),homeGoals:g.homeGoals,awayGoals:g.awayGoals})),standings:HLMPhase10.calculateStandings(s.universe.teams,s.activity.games)}});
  assert.equal(await event,true,'real storage event on GM approval');
  const stale=await a.evaluate(()=>{const m=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);const before=localStorage.getItem(m.key);try{m.advanceNextDay(162300,true);return false}catch(e){return /changed|reload/i.test(String(e))&&localStorage.getItem(m.key)===before}});
  assert.equal(stale,true,'stale tab cannot commit');
  await b.locator('#gm-m1620-refresh').click();
  const check=await b.evaluate(()=>{const m=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);const s=m.peek(),gm=String(s.meta.controlledTeamId);const cpu=s.activity.games.filter(g=>g.status==='final'&&String(g.homeTeamId)!==gm&&String(g.awayTeamId)!==gm);const gmFinal=s.activity.games.filter(g=>g.status==='final'&&(String(g.homeTeamId)===gm||String(g.awayTeamId)===gm));const rendered=[...document.querySelectorAll('#gm-m1620-list li')].map(li=>({id:li.dataset.gameId,text:li.textContent}));return {cpu:cpu.map(g=>({id:String(g.id),awayGoals:g.awayGoals,homeGoals:g.homeGoals})),gmCount:gmFinal.length,rendered,standings:HLMPhase10.calculateStandings(s.universe.teams,s.activity.games)}});
  assert.ok(check.gmCount>0&&check.cpu.length>0,'real-universe GM and CPU finals present');
  assert.deepEqual(check.standings,committed.standings,'standings from same persisted games');
  for(const game of check.cpu){const rows=check.rendered.filter(x=>x.id===game.id);assert.equal(rows.length,1,'each CPU final displayed once');assert.ok(rows[0].text.includes('Final '+game.awayGoals+'-'+game.homeGoals),'displayed CPU score matches saved final')}
  const saved=await b.evaluate(k=>localStorage.getItem(k),key);
  await b.locator('#gm-m1620-refresh').click();assert.equal(await b.evaluate(k=>localStorage.getItem(k),key),saved,'read-only history refresh no-save');
  await b.reload();await b.locator('#gm-m1620-list li').first().waitFor({state:'visible',timeout:15000});
  const restored=await b.evaluate(()=>{const m=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);const s=m.peek();return {finals:s.activity.games.filter(g=>g.status==='final').map(g=>({id:String(g.id),date:g.date,homeTeamId:String(g.homeTeamId),awayTeamId:String(g.awayTeamId),homeGoals:g.homeGoals,awayGoals:g.awayGoals})),standings:HLMPhase10.calculateStandings(s.universe.teams,s.activity.games)}});
  assert.deepEqual(restored.finals,committed.finals,'reload retains authoritative GM/CPU finals');assert.deepEqual(restored.standings,committed.standings);
  const continuity=await b.evaluate(()=>{const m=HLMIsolatedSingleGame.create(HLMPhase10,localStorage);m.load();const before=m.peek().activity.games.filter(g=>g.status==='final');const baseline=localStorage.getItem(m.key);try{m.advanceNextDay(162400,false);throw Error('Declined day accepted')}catch(e){if(!/approval/i.test(String(e)))throw e}if(localStorage.getItem(m.key)!==baseline)throw Error('Decline mutated save');m.advanceNextDay(162401,true);const after=m.peek().activity.games;return before.every(g=>JSON.stringify(g)===JSON.stringify(after.find(x=>String(x.id)===String(g.id))))});
  assert.equal(continuity,true,'subsequent approved day retains prior GM and CPU finals');
  for(const tab of [a,b])assert.equal(await tab.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'M1622_PRODUCTION_SENTINEL');
  console.log('Mission 1622 real-universe GM/CPU finals, standings, visible history, reload, decline, stale-tab and isolation PASS',committed.days);
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
