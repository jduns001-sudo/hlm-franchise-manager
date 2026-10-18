'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch();try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const app=fs.readFileSync(path.join(__dirname,'app.html'),'utf8');
const scripts=['hlm-phase11-roster-preview-adapter.js','hlm-phase11-frontoffice-roster-bridge.js','hlm-phase11-frontoffice-roster-preview-ui.js'];
await page.goto('about:blank');
for(const f of scripts)await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,f),'utf8')});
const result=await page.evaluate(()=>{const db={schema:7,settings:{controlledTeamId:1},teams:[{id:1,name:'Home'},{id:2,name:'Away'}],players:[{id:10,teamId:1,privateNote:'secret'},{id:20,teamId:2},{id:30,teamId:null},{id:40,teamId:2,retired:true}]};const before=JSON.stringify(db);window.HLMFrontOfficeRosterPreviewUI.mount(()=>db);return {before,db}});
assert.equal(await page.locator('#hlm-preview-panel').isVisible(),false);
await page.locator('#hlm-preview-launcher').click();assert.match(await page.locator('#hlm-preview-status').innerText(),/Not activated/);
await page.getByRole('button',{name:'I approve preview'}).click();
assert.match(await page.locator('#hlm-preview-status').innerText(),/2 teams, 2 assigned active players/);
assert.equal((await page.locator('#hlm-preview-panel').innerText()).includes('secret'),false);
assert.equal(await page.evaluate(()=>JSON.stringify(window.__testDb||{})), '{}');
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
assert.ok(app.includes('hlm-phase11-frontoffice-roster-preview-ui.js"></script>\n<script>'));
console.log('Realistic mobile roster preview and repaired script boundary passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
