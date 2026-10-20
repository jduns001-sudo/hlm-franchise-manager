'use strict';
/* Mission 1383: read-only live GitHub Pages verification. No localStorage writes. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const crypto=require('node:crypto');
const fs=require('node:fs');
const base='https://jduns001-sudo.github.io/hlm-franchise-manager/';
const expectedBlob=process.env.EXPECTED_NHL_JS_BLOB||'026b8c0cab5f89202237bc8cfafd00df0aa48507';
function gitBlob(s){return crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')}
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const jsURL=new URL('hlm-phase11-new-franchise.js',base);
  jsURL.searchParams.set('verification','mission1383-'+Date.now());
  const response=await page.request.get(jsURL.toString(),{headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},timeout:45000});
  assert.equal(response.status(),200,'live canonical JavaScript must be HTTP 200');
  const body=await response.text();
  assert.equal(gitBlob(body),expectedBlob,'live JavaScript blob must match verified Mission 1382 main blob');
  assert.match(body,/const CANONICAL=/);
  assert.doesNotMatch(body,/const NHL=new Set/);
  const url=new URL('hlm-phase11-isolated-single-game.html',base);
  url.searchParams.set('verification','mission1383-'+Date.now());
  await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('#new-team')?.options.length===32&&document.querySelector('#new-franchise')&&!document.querySelector('#new-franchise').disabled,{timeout:60000});
  const options=await page.locator('#new-team option').evaluateAll(nodes=>nodes.map(n=>({id:n.value,label:n.textContent})));
  assert.equal(options.length,32);
  assert.equal(new Set(options.map(o=>o.id)).size,32);
  assert.equal(new Set(options.map(o=>o.label)).size,32);
  assert.deepEqual(options.filter(o=>o.label==='Calgary (CGY)').map(o=>o.id),['20']);
  assert.deepEqual(options.filter(o=>o.label==='Chicago (CHI)').map(o=>o.id),['16']);
  assert.ok(!options.some(o=>/Chicoutimi/.test(o.label)));
  assert.equal(await page.evaluate(()=>localStorage.length),0,'live read-only verification must not write saves');
  console.log('Mission 1383 live Pages PASS: exact blob '+expectedBlob+', 32 unique canonical teams, no Chicoutimi, no saves written');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
