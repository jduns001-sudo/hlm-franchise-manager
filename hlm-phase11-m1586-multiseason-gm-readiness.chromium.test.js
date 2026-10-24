'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
const server=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));if(!/^[\w.-]+$/.test(name)){res.writeHead(404).end();return}fs.readFile(path.join(__dirname,name),(err,data)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'content-type':name.endsWith('.js')?'application/javascript':name.endsWith('.json')?'application/json':'text/html'}).end(data)})});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;try{browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const url='http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html';
await page.goto(url,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','M1586_PRODUCTION_SENTINEL'));
await page.waitForFunction(()=>!!window.HLMMultiseasonGMReadiness&&document.getElementById('gm-multiseason-readiness-status').textContent.length>0);
assert.equal(await page.locator('#gm-multiseason-readiness-open').isDisabled(),true);
const scenario=await page.evaluate(async()=>{const response=await fetch('./hlm-universe.json');const universe=await response.json();const engine={...window.HLMPhase10};const builder=window.HLMNewFranchise;const teams=builder.teams(universe);const state=builder.build(universe,teams[0].id,engine);
state.extensions=state.extensions||{};state.extensions.phase10CurrentSeasonId='2027-28';state.extensions.phase10Playoffs=null;state.history=state.history||{};state.history.seasons=[{seasonId:'2026-27',championTeamId:state.meta.controlledTeamId}];state.activity.games[0].id='m1586-scheduled';state.activity.games[0].status='scheduled';const gate=window.HLMMultiseasonGMReadiness.create(()=>structuredClone(state));const inspected=gate.inspect();const opened=gate.open();gate.inspect();const declined=gate.decline();let blocked=false;try{gate.open()}catch(e){blocked=/Refresh/.test(e.message)}return {inspected,opened,declined,blocked}});
assert.equal(scenario.inspected.kind,'scheduled-day-review');assert.equal(scenario.opened.target,'day-review');assert.equal(scenario.opened.saved,false);assert.equal(scenario.declined.saved,false);assert.equal(scenario.blocked,true);
assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'M1586_PRODUCTION_SENTINEL');
assert.deepEqual(errors,[]);console.log('M1586 mobile Chromium readiness: real roster saved-state decision, explicit GM control, decline no-save, stale reload safeguards and production localStorage isolation PASS')
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
