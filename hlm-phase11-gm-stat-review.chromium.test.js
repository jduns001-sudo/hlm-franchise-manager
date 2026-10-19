'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {buildUnifiedBoxScores}=require('./hlm-phase11-unified-box-scores');
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':'text/html');res.end(b)})});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const url='http://127.0.0.1:'+server.address().port;
 await page.goto(url+'/app.html',{waitUntil:'domcontentloaded'});
 await page.locator('#hlm-gm-season-entry').waitFor({timeout:90000});
 await page.evaluate(()=>{localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');go('schedule')});
 await page.locator('#hlm-isolated-single-game-link').click();await page.locator('#file').waitFor();
 const players=[1,2].flatMap(teamId=>['C','LW','RW','D','G'].map((position,i)=>({id:teamId*100+i,teamId,position,ovr:80})));
 const state=createGameStateEnvelope({meta:{saveId:'gm-stats-mobile',controlledTeamId:1,currentDate:'2026-10-18'},teams:[{id:1,name:'Owner'},{id:2,name:'CPU'}],players});
 const games=[{id:'regular',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:0,season:'2027'},
 {id:'playoff',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:0,awayGoals:1,season:'2027',playoff:true},
 {id:'future',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:0,season:'2028'}];
 state.activity.games=games;
 state.extensions.phase11ExperimentalBoxScores=buildUnifiedBoxScores(state,games,games.map(g=>({gameId:g.id,teamId:1,playerId:100,sequence:1})),13);
 await page.locator('#file').setInputFiles({name:'stats.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
 page.once('dialog',d=>d.accept());await page.locator('#import').click();
 await page.waitForFunction(()=>document.querySelector('#gm-stat-report')?.textContent.includes('Games: 3'));
 assert.match(await page.locator('#gm-stat-report').innerText(),/NOT OFFICIAL/);
 await page.locator('#gm-stat-season').selectOption('2027');await page.locator('#gm-stat-kind').selectOption('playoffs');
 assert.match(await page.locator('#gm-stat-report').innerText(),/Games: 1/);
 await page.locator('#gm-stat-kind').selectOption('regular');assert.match(await page.locator('#gm-stat-report').innerText(),/Games: 1/);
 await page.reload();await page.locator('#gm-stat-report').waitFor();
 assert.match(await page.locator('#gm-stat-report').innerText(),/Games: 3/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
 assert.equal(await page.locator('#gm-stat-report').isVisible(),true);
 console.log('Mission 1358 real app mobile: GM stats, season/playoff selection, reload, production isolation passed');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}})().catch(e=>{console.error(e);process.exitCode=1});
