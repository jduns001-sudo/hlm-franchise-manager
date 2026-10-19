'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[a-zA-Z0-9_.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':'text/html');res.end(b)})});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await page.goto('http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html');
 const result=await page.evaluate(async()=>{
  localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');
  localStorage.setItem('hlm-phase11-m1340-isolated-single-game-v1','ISOLATED_SENTINEL');
  const script=document.createElement('script');script.src='/hlm-phase10-game-simulator.js';
  await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.appendChild(script)});
  const sim=window.HLMPhase10GameSimulator.simulateGameScore,base={gameId:'g1',homeTeamId:1,awayTeamId:2,seed:1372};
  const legacy=sim(base),rated={...base,experimentalApprovedGoalieOverall:80,experimentalApprovedGoalieSide:'home',experimentalVerifiedSkaterAverage:95,experimentalVerifiedSkaterSide:'home'};
  return {legacy,approved:sim(rated),replay:sim(rated),production:localStorage.getItem('hlm_front_office_v8'),isolated:localStorage.getItem('hlm-phase11-m1340-isolated-single-game-v1')};
 });
 assert.equal(result.approved.homeGoals,result.legacy.homeGoals+1);
 assert.equal(result.approved.official,false);
 assert.deepEqual(result.replay,result.approved);
 assert.equal(result.production,'PRODUCTION_SENTINEL');assert.equal(result.isolated,'ISOLATED_SENTINEL');
 console.log('Mission 1373 mobile Chromium: existing score engine deterministic and production/isolated save keys untouched');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
