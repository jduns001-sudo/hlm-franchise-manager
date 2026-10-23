'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();fs.readFile(path.join(__dirname,name),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(b)})});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch();try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
await page.goto('http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html');
await page.waitForFunction(()=>!!window.HLMGuardedMobileLifecycle&&document.querySelector('#new-franchise')?.disabled===false,null,{timeout:30000});
const result=await page.evaluate(()=>{
 const key='hlm-phase11-m1340-isolated-single-game-v1';
 let saved=JSON.stringify({meta:{controlledTeamId:1},universe:{teams:[{id:1},{id:2},{id:3},{id:4}]},activity:{games:[{status:'final'}]},history:{seasons:[]},extensions:{}});
 const storage={getItem:k=>k===key?saved:null};
 const state=JSON.parse(saved);
 let writes=0;
 const manager={peek:()=>state,startPlayoffs:()=>{writes++;return {seeds:[{teamId:1}]}},advancePlayoff:()=>{writes++;return {result:{gameId:'PO'}}},archiveSeason:()=>{writes++;return {summary:{championTeamId:1}}}};
 const guard=window.HLMGuardedMobileLifecycle.create(manager,storage,key);
 const review=guard.review('playoffs');const decline=guard.decline(review.reviewSequence);
 let replayBlocked=false;try{guard.approve(review.reviewSequence)}catch(e){replayBlocked=/Stale/.test(e.message)}
 const again=guard.review('playoffs');saved+=' ';let staleBlocked=false;try{guard.approve(again.reviewSequence)}catch(e){staleBlocked=/changed/.test(e.message)}
 return {declineSaved:decline.saved,writes,replayBlocked,staleBlocked,production:localStorage.getItem('hlm_front_office_v8')};
});
assert.deepEqual({declineSaved:result.declineSaved,writes:result.writes,replayBlocked:result.replayBlocked,staleBlocked:result.staleBlocked},{declineSaved:false,writes:0,replayBlocked:true,staleBlocked:true});
assert.equal(await page.locator('#playoff-start').count(),1);
assert.equal(await page.locator('#playoff-next').count(),1);
assert.equal(await page.locator('#season-archive').count(),1);
console.log('Real mobile Chromium lifecycle adapter safety passed');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}})().catch(e=>{console.error(e);process.exitCode=1});
