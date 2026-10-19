'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(b)})});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const url='http://127.0.0.1:'+server.address().port;
 await page.goto(url+'/app.html',{waitUntil:'domcontentloaded'});await page.locator('#hlm-gm-season-entry').waitFor({timeout:90000});
 await page.evaluate(()=>{localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');go('schedule')});
 await page.locator('#hlm-isolated-single-game-link').click();await page.locator('#file').waitFor();
 const teams=[1,2,3,4].map(id=>({id,name:'Team '+id}));
 const pairs=[[1,2],[3,4],[1,3],[2,4],[1,4],[2,3]];
 const games=pairs.map(([homeTeamId,awayTeamId],i)=>({id:'r'+i,date:'2026-10-'+(19+i),homeTeamId,awayTeamId,status:'scheduled'}));
 const state={schemaVersion:1,meta:{saveId:'playoff-acceptance',createdAt:null,updatedAt:null,controlledTeamId:1,currentDate:'2026-10-18'},universe:{players:[],teams,leagues:[],prospects:[],staff:[]},assets:{contracts:[],draftPicks:[]},activity:{transactions:[],games,injuries:[]},history:{seasons:[],statistics:[],records:[]},finances:{},extensions:{}};
 await page.locator('#file').setInputFiles({name:'season.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
 page.once('dialog',d=>d.accept());await page.locator('#import').click();
 await page.waitForFunction(()=>document.querySelector('#output')?.textContent.includes('Scheduled games remaining: 6'));
 assert.equal(await page.locator('#playoff-start').isDisabled(),true);
 for(let i=0;i<6;i++){
  await page.locator('#day-review').click();
  page.once('dialog',d=>d.accept());await page.locator('#day-approve').click();
  await page.waitForFunction(({n})=>document.querySelector('#output')?.textContent.includes('Completed: '+n),{n:i+1});
 }
 assert.equal(await page.locator('#playoff-start').isDisabled(),false);
 page.once('dialog',d=>d.dismiss());await page.locator('#playoff-start').click();
 assert.equal(await page.locator('#playoff-start').isDisabled(),false);
 page.once('dialog',d=>d.accept());await page.locator('#playoff-start').click();
 await page.waitForFunction(()=>document.querySelector('#playoff-report')?.textContent.includes('bracket initialized'));
 await page.reload();await page.locator('#playoff-next').waitFor();
 assert.equal(await page.locator('#playoff-next').isDisabled(),false);
 let count=0;
 while(!(await page.locator('#playoff-next').isDisabled())){
  page.once('dialog',d=>d.accept());await page.locator('#playoff-next').click();
  await page.waitForFunction(()=>document.querySelector('#playoff-report')?.textContent.includes('Persisted playoff game'));
  await page.reload();await page.locator('#playoff-next').waitFor();
  if(++count>21)throw Error('Playoff did not finish');
 }
 assert.match(await page.locator('#playoff-report').innerText(),/Champion: Team/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
 console.log('Mobile real Front Office: human-approved season, best-of-seven playoffs, reload after each game and champion passed; games: '+count);
}finally{await browser.close();await new Promise(ok=>server.close(ok))}})().catch(e=>{console.error(e);process.exitCode=1});
