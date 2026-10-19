'use strict';
/* Mobile Chromium isolated-stat persistence smoke; simulation invariants are covered by Node CI. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {buildUnifiedBoxScores,aggregateUnifiedBoxScores}=require('./hlm-phase11-unified-box-scores');
const http=require('node:http');
const players=[1,2].flatMap(teamId=>['C','LW','RW','D','G'].map((position,i)=>({id:teamId*100+i,teamId,position,ovr:80})));
const state=createGameStateEnvelope({meta:{currentDate:'2026-10-18'},teams:[{id:1},{id:2}],players});
const games=[{id:'regular',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:0,season:'2027'},
 {id:'playoff',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:0,awayGoals:1,season:'2027',playoff:true}];
const events=[{gameId:'regular',teamId:1,playerId:100,sequence:1},{gameId:'playoff',teamId:1,playerId:100,sequence:1}];
const boxes=buildUnifiedBoxScores(state,games,events,13),history=aggregateUnifiedBoxScores(boxes);
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><main id="stats"></main>')});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(payload=>{
   localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');
   localStorage.setItem('hlm-phase11-isolated-season-m1357-mobile',JSON.stringify(payload));
   document.querySelector('#stats').textContent=JSON.stringify(payload.history);
  },{boxes,history});
  await page.reload();
  const restored=await page.evaluate(()=>{
   const raw=localStorage.getItem('hlm-phase11-isolated-season-m1357-mobile');
   const data=JSON.parse(raw);document.querySelector('#stats').textContent=JSON.stringify(data.history);
   return {data,production:localStorage.getItem('hlm_front_office_v8')};
  });
  assert.deepEqual(restored.data,{boxes,history});
  assert.equal(restored.production,'PRODUCTION_SENTINEL');
  assert.equal(restored.data.history.length,2);
  assert.equal(await page.locator('#stats').isVisible(),true);
  console.log('Mobile Chromium isolated stats storage/reload and regular/playoff separation passed');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
