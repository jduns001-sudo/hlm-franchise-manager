'use strict';
/* Mobile Chromium isolated-stat persistence smoke; simulation invariants are covered by Node CI. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {buildUnifiedBoxScores,aggregateUnifiedBoxScores}=require('./hlm-phase11-unified-box-scores');
const {buildExperimentalGoalEvents}=require('./hlm-phase10-experimental-player-goals');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const players=[1,2].flatMap(teamId=>['C','LW','RW','D','D','G'].map((position,i)=>({id:teamId*100+i,teamId,position,ovr:80})));
const state=createGameStateEnvelope({meta:{controlledTeamId:1,currentDate:'2026-10-18'},teams:[{id:1},{id:2}],players});
state.extensions.phase11GmApprovedSkaters={teamId:1,playerIds:[100,102,103]};
state.activity.injuries.push({playerId:101,status:'out'});
const games=[{id:'regular',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:2,awayGoals:0,season:'2027'},
 {id:'playoff',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:0,awayGoals:1,season:'2027',playoff:true}];
const events=games.flatMap(game=>buildExperimentalGoalEvents(state,game,13));
const boxes=buildUnifiedBoxScores(state,games,events,13),history=aggregateUnifiedBoxScores(boxes);
assert.deepEqual(boxes[0].home.players.map(p=>p.playerId),[100,102,103]);
assert(boxes[0].home.players.every(p=>p.playerId!==101&&p.playerId!==104));
const server=http.createServer((req,res)=>{
 if(req.url==='/hlm-phase10-roster-lab.bundle.js'){res.setHeader('Content-Type','text/javascript');return res.end(fs.readFileSync(path.join(__dirname,'hlm-phase10-roster-lab.bundle.js')));}
 res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/hlm-phase10-roster-lab.bundle.js"></script><main id="stats"></main>');
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:'+server.address().port);
  const generated=await page.evaluate(()=>{
   localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');
   const state=window.HLMRosterLab.createRosterLabFranchise();
   state.extensions.phase11GmApprovedSkaters={teamId:1,playerIds:[100,102,103]};
   const store=window.HLMRosterLab.createRosterBrowserStore(localStorage);
   store.save(state);
   const result=store.advanceAndSave(20261014),saved=store.load();
   const box=saved.extensions.phase11ExperimentalBoxScores.find(b=>String(b.home.teamId)==='1'||String(b.away.teamId)==='1');
   const side=String(box.home.teamId)==='1'?'home':'away';
   return {advanced:result.advanced,saved:result.saved,players:box[side].players.map(p=>p.playerId),official:box.official};
  });
  assert.equal(generated.advanced,true);assert.equal(generated.saved,true);
  assert.deepEqual(generated.players,[100,102,103]);assert.equal(generated.official,false);
  await page.reload();
  const restoredFranchise=await page.evaluate(()=>{
   const saved=window.HLMRosterLab.createRosterBrowserStore(localStorage).load();
   const box=saved.extensions.phase11ExperimentalBoxScores.find(b=>String(b.home.teamId)==='1'||String(b.away.teamId)==='1');
   const side=String(box.home.teamId)==='1'?'home':'away';
   return {players:box[side].players.map(p=>p.playerId),production:localStorage.getItem('hlm_front_office_v8')};
  });
  assert.deepEqual(restoredFranchise.players,[100,102,103]);
  assert.equal(restoredFranchise.production,'PRODUCTION_SENTINEL');
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
  console.log('Mobile Chromium approved-lineup stats, bundle reload, production isolation, and regular/playoff separation passed');
 }finally{
  try{if(browser)await browser.close();}
  finally{await new Promise(resolve=>server.close(resolve));}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
