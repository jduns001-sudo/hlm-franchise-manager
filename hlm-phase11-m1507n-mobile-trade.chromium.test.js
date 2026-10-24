'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {KEY}=require('./hlm-phase11-isolated-single-game');
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=path.basename(decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!/^hlm-[a-z0-9.-]+$/.test(name)){res.writeHead(404);res.end();return}
  fs.readFile(path.join(__dirname,name),(error,data)=>{
   if(error){res.writeHead(404);res.end();return}
   res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':'text/html');res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const root='http://127.0.0.1:'+server.address().port+'/';
  const source=createGameStateEnvelope({meta:{controlledTeamId:1},
   teams:[{id:1,name:'GM'},{id:2,name:'CPU'}],
   players:[{id:'a',name:'GM Skater',teamId:1,position:'C',overall:85},
    {id:'b',name:'CPU Skater',teamId:2,position:'D',overall:80}],
   contracts:[{playerId:'a',teamId:1,status:'active',aav:3,tradePermission:'allowed'},
    {playerId:'b',teamId:2,status:'active',aav:4,tradePermission:'allowed'}]});
  source.finances.teamCapLimits={1:10,2:10};source.extensions.tradeRosterLimits={1:23,2:23};
  await page.goto(root+'hlm-phase11-mobile-office.html');
  await page.evaluate(({key,raw})=>{
   localStorage.setItem(key,raw);localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL');
  },{key:KEY,raw:JSON.stringify(source)});
  const before=await page.evaluate(key=>localStorage.getItem(key),KEY);
  await page.reload();
  await page.locator('nav [data-panel="team"]').click();
  const link=page.locator('#team a[href$="hlm-phase11-m1507m-mobile-trade-review.html"]');
  await link.waitFor({state:'visible'});
  await link.click();
  await page.locator('#review').waitFor({state:'visible'});
  assert.equal(await page.locator('#review').isEnabled(),true);
  await page.locator('#outgoing').selectOption('a');
  await page.locator('#incoming').selectOption('b');
  for(const decision of ['approve','decline','cancel']){
   await page.locator('#review').click();
   assert.match(await page.locator('#report').innerText(),/favorable-for-receiving-team/);
   assert.match(await page.locator('#report').innerText(),/Mobile CPU decision indication \(valuation-derived, not authenticated\): accept preview/);
   assert.match(await page.locator('#report').innerText(),/CPU consent: NOT authenticated/);
   await page.locator('#'+decision).click();
   assert.match(await page.locator('#report').innerText(),/Settlement: BLOCKED. Saved: NO/);
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),before);
  }
  await page.locator('#review').click();
  const stale=JSON.parse(before);stale.meta.currentDate='2029-01-01';
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:KEY,raw:JSON.stringify(stale)});
  await page.locator('#approve').click();
  assert.match(await page.locator('#report').innerText(),/stale-save/);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),JSON.stringify(stale));
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  console.log('Mission 1507N real mobile Chromium guarded trade acceptance passed');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
