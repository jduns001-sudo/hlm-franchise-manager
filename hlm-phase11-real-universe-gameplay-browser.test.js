'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));
 if(!/^[\w.-]+$/.test(name))return res.writeHead(404).end();
 fs.readFile(path.join(__dirname,name),(error,body)=>{
  if(error)return res.writeHead(404).end();
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');
  res.end(body);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const base='http://127.0.0.1:'+server.address().port+'/';
  await page.goto(base+'app.html',{waitUntil:'domcontentloaded'});
  assert((await page.locator('body').innerText()).length>40,'Front Office must render content');
  const production=await page.evaluate(()=>({keys:Object.keys(localStorage),title:document.title}));
  assert(production.title,'Front Office title required');
  assert.equal(production.keys.some(k=>k==='hlm-phase11-active-source-v1'),false,'No automatic imported-source activation');
  await page.goto(base+'phase10-roster-lab.html',{waitUntil:'domcontentloaded'});
  assert((await page.locator('body').innerText()).length>40,'Experimental roster lab must render content');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm-phase11-active-source-v1')),null);
  console.log('Phase 11 mobile Chromium Front Office and roster lab read-only smoke passed');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
