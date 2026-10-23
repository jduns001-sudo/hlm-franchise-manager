'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));
 if(!/^[\\w.-]+$/.test(name))return res.writeHead(404).end();
 fs.readFile(path.join(__dirname,name),(err,data)=>{
  if(err)return res.writeHead(404).end();
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');
  res.end(data);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const origin='http://127.0.0.1:'+server.address().port;
  await page.goto(origin+'/app.html');
  const link=page.locator('#hlm-alpha1-play-entry');
  await assert.doesNotReject(()=>link.waitFor({state:'visible',timeout:30000}));
  assert.equal(await link.getAttribute('href'),'./hlm-phase11-isolated-single-game.html');
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','M1496_PRODUCTION_SENTINEL'));
  await link.click();
  await page.waitForURL('**/hlm-phase11-isolated-single-game.html');
  assert.match(await page.locator('#season-entry-safety').innerText(),/isolated save/i);
  await page.waitForFunction(()=>document.querySelector('#new-franchise')?.disabled===false,null,{timeout:30000});
  const before=await page.evaluate(()=>localStorage.getItem('hlm-phase11-m1340-isolated-single-game-v1'));
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#new-franchise').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm-phase11-m1340-isolated-single-game-v1')),before,'cancel must not save');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'M1496_PRODUCTION_SENTINEL');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#new-franchise').click();
  await page.waitForFunction(()=>!!localStorage.getItem('hlm-phase11-m1340-isolated-single-game-v1'));
  const controlled=await page.evaluate(()=>JSON.parse(localStorage.getItem('hlm-phase11-m1340-isolated-single-game-v1')).meta.controlledTeamId);
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#new-franchise')?.disabled===true);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hlm-phase11-m1340-isolated-single-game-v1')).meta.controlledTeamId),controlled);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'M1496_PRODUCTION_SENTINEL');
  console.log('Mission 1496 mobile entry, cancel, approve, reload and isolation passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
