'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{const server=http.createServer((req,res)=>{const file=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(file))return res.writeHead(404).end();fs.readFile(path.join(__dirname,file),(err,data)=>err?res.writeHead(404).end():res.writeHead(200,{'content-type':file.endsWith('.js')?'application/javascript':'text/html'}).end(data))});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto('http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html');
const result=await page.evaluate(async()=>{
localStorage.setItem('hlm_front_office_v8','M1615_PRODUCTION_SENTINEL');
const fixture=document.createElement('div');fixture.id='m1615-positive-fixture';fixture.innerHTML='<section id="gm-m1603-readiness"><p id="gm-m1603-result">Not reviewed</p></section><select id="m1615-picker"><option value="game-next">Game next</option></select><button id="m1615-open">Open game</button><button id="m1615-skater">Review skaters</button>';document.body.append(fixture);
const state={meta:{controlledTeamId:5,revision:1},activity:{games:[{id:'game-next',status:'scheduled',homeTeamId:5,awayTeamId:2}]}};
const root=window,origGet=document.getElementById.bind(document);let openCount=0,reviewCount=0;
const picker=fixture.querySelector('#m1615-picker'),openGame=fixture.querySelector('#m1615-open'),review=fixture.querySelector('#m1615-skater');
openGame.addEventListener('click',()=>openCount++);review.addEventListener('click',()=>reviewCount++);
const doc={getElementById(id){const map={'gm-m1603-readiness':fixture.querySelector('#gm-m1603-readiness'),'gm-m1603-result':fixture.querySelector('#gm-m1603-result'),'gm-upcoming-game-select':picker,'gm-upcoming-game-open':openGame,'gm-game-day-review':review};return map[id]||null},createElement:document.createElement.bind(document)};
const modal=window.confirm;window.confirm=()=>true;
let bridge;try{
bridge=root.HLMGMGameDayReviewBridge.mount(doc,()=>structuredClone(state));
const initiallyDisabled=bridge.button.disabled;
doc.getElementById('gm-m1603-result').textContent='GM-approved selection handed to existing game review. No save.';
await new Promise(resolve=>setTimeout(resolve,0));
const enabledAfterApproval=!bridge.button.disabled;
bridge.button.click();
const positive={initiallyDisabled,enabledAfterApproval,openCount,reviewCount,report:bridge.report.textContent,production:localStorage.getItem('hlm_front_office_v8')};
state.meta.revision++;picker.dispatchEvent(new Event('change',{bubbles:true}));
const invalidated=bridge.button.disabled;
return {...positive,invalidated}
}finally{window.confirm=modal}
});
assert.equal(result.initiallyDisabled,true);
assert.equal(result.enabledAfterApproval,true);
assert.equal(result.openCount,1,'Existing guarded game selector must open exactly once');
assert.equal(result.reviewCount,1,'Existing GM skater review must open exactly once');
assert.match(result.report,/review opened/i);
assert.equal(result.invalidated,true);
assert.equal(result.production,'M1615_PRODUCTION_SENTINEL');
console.log('Mission 1615 mobile positive GM approval-to-existing skater-review handoff, single-use and production isolation PASS');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});