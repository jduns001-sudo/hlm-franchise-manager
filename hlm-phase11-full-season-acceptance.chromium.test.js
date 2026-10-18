'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(b)})});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const url='http://127.0.0.1:'+server.address().port;
 await page.goto(url+'/app.html',{waitUntil:'domcontentloaded'});
 await page.locator('#hlm-gm-season-entry').waitFor({timeout:90000});
 await page.evaluate(()=>{localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');go('schedule')});
 await page.locator('#hlm-isolated-single-game-link').click();await page.locator('#file').waitFor();
 const teams=[{id:1,name:'Owner'},{id:2,name:'CPU A'},{id:3,name:'CPU B'},{id:4,name:'CPU C'}];
 const pairs=[[1,2],[3,4],[1,3],[2,4],[1,4],[2,3],[2,1],[4,3],[3,1],[4,2],[4,1],[3,2]];
 const games=pairs.map(([homeTeamId,awayTeamId],i)=>({id:'season-'+String(i+1).padStart(2,'0'),date:'2026-10-'+String(19+i).padStart(2,'0'),homeTeamId,awayTeamId,status:'scheduled'})).reverse();
 const state={schemaVersion:1,meta:{saveId:'season-acceptance',createdAt:null,updatedAt:null,controlledTeamId:1,currentDate:'2026-10-18'},universe:{players:[],teams,leagues:[],prospects:[],staff:[]},assets:{contracts:[],draftPicks:[]},activity:{transactions:[],games,injuries:[]},history:{seasons:[],statistics:[],records:[]},finances:{},extensions:{}};
 await page.locator('#file').setInputFiles({name:'season.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
 page.once('dialog',d=>d.dismiss());await page.locator('#import').click();
 assert.match(await page.locator('#output').innerText(),/No isolated save loaded/);
 page.once('dialog',d=>d.accept());await page.locator('#import').click();
 await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining: 12'));
 for(let i=0;i<12;i++){
  await page.locator('#day-review').click();
  const expected='2026-10-'+String(19+i).padStart(2,'0');
  assert.match(await page.locator('#day-report').innerText(),new RegExp(expected));
  if(i===0){page.once('dialog',d=>d.dismiss());await page.locator('#day-approve').click();assert.match(await page.locator('#output').innerText(),/Scheduled games remaining: 12/)}
  page.once('dialog',d=>d.accept());await page.locator('#day-approve').click();
  await page.waitForFunction(({expected})=>document.querySelector('#day-report')?.textContent.includes('Persisted isolated day '+expected),{expected});
  await page.reload();await page.locator('#output').waitFor();
  assert.match(await page.locator('#output').innerText(),new RegExp('Completed: '+(i+1)+'(?:\\D|$)'));
  assert.match(await page.locator('#season-dashboard').innerText(),new RegExp('Upcoming games: '+(11-i)+'(?:\\D|$)'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
 }
 assert.equal(await page.locator('#day-review').isDisabled(),true);
 assert.equal(await page.locator('#day-approve').isDisabled(),true);
 assert.match(await page.locator('#season-dashboard').innerText(),/Standings:/);
 assert.match(await page.locator('#gm-daily-brief').innerText(),/Next scheduled day: None/);
 const saved=await page.evaluate(()=>Object.entries(localStorage).filter(([k])=>k.startsWith('hlm-phase11-m1340-isolated-single-game')));
 assert.equal(saved.length,1);
 assert.equal(JSON.parse(saved[0][1]).activity.games.filter(g=>g.status==='final').length,12);
 assert.equal(new Set(JSON.parse(saved[0][1]).activity.games.map(g=>g.id)).size,12);
 console.log('Mobile full 12-game season: import decline/approve, 12 explicit day approvals, final standings, reload, no duplicates, production isolation passed');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}})().catch(e=>{console.error(e);process.exitCode=1});
