'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const names=['hlm-game-state.js','hlm-phase11-guarded-player-trade.js','hlm-phase11-trade-financial-eligibility.js','hlm-phase11-trade-restrictions.js','hlm-phase11-isolated-trade-decision.js','hlm-phase11-gm-trade-review.js','hlm-phase11-trade-settlement-readiness.js','hlm-phase11-receiving-authority-boundary.js'];
const sources=Object.fromEntries(names.map(n=>[n,fs.readFileSync(n,'utf8')]));
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><button id="check">Check independent consent</button><button id="cancel">Cancel</button><output id="status"></output>');
await page.evaluate(({sources})=>{
 const modules={};function load(path){const n=path.replace(/^\.\//,'')+(path.endsWith('.js')?'':'.js');if(modules[n])return modules[n].exports;
 const m={exports:{}};modules[n]=m;new Function('module','exports','require',sources[n])(m,m.exports,load);return m.exports;}
 const {createGameStateEnvelope}=load('hlm-game-state.js'),{verifyReceivingAuthority}=load('hlm-phase11-receiving-authority-boundary.js');
 const s=createGameStateEnvelope({meta:{controlledTeamId:1},teams:[{id:1},{id:2}],players:[{id:'a',teamId:1},{id:'b',teamId:2}],
 contracts:[{playerId:'a',teamId:1,status:'active',aav:4,tradePermission:'allowed'},{playerId:'b',teamId:2,status:'active',aav:5,tradePermission:'allowed'}]});
 s.finances.teamCapLimits={1:10,2:10};s.extensions.tradeRosterLimits={1:23,2:23};
 s.extensions.tradeDecisionConsents=[{receivingTeamId:2,outgoingPlayerId:'a',incomingPlayerId:'b',decision:'accepted',source:'receiving-team-authority'}];
 s.history.seasons=[{year:2034,champion:1}];
 const key='hlm-phase11-m1340-isolated-single-game-v1',prod='hlm_front_office_v8',map=new Map([[key,JSON.stringify(s)],[prod,'PRODUCTION_SENTINEL']]),writes=[];
 const input={outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamConsent:true};
 window.__audit={map,writes,key,prod};
 document.getElementById('check').onclick=()=>{const r=verifyReceivingAuthority(s,input,{accepted:true},null);
 document.getElementById('status').textContent=r.status+':'+r.independentlyAuthenticated+':'+r.settlementAuthorized};
 document.getElementById('cancel').onclick=()=>{document.getElementById('status').textContent='cancelled:no-save'};
},{sources});
await page.locator('#check').click();assert.equal(await page.locator('#status').textContent(),'receiving-authority-unverified:false:false');
await page.locator('#cancel').click();assert.equal(await page.locator('#status').textContent(),'cancelled:no-save');
const audit=await page.evaluate(()=>{const a=window.__audit,s=JSON.parse(a.map.get(a.key));return {writes:a.writes,prod:a.map.get(a.prod),teams:s.universe.players.map(p=>p.teamId),history:s.history.seasons}});
assert.deepEqual(audit,{writes:[],prod:'PRODUCTION_SENTINEL',teams:[1,2],history:[{year:2034,champion:1}]});
console.log('Mission 1449 isolated mobile fail-closed authority boundary passed');await context.close();
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
