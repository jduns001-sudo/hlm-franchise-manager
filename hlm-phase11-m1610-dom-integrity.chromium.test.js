'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=decodeURIComponent((req.url||'/').split('?')[0].slice(1));
  if(!/^[\\w.-]+$/.test(name))return res.writeHead(404).end();
  fs.readFile(path.join(__dirname,name),(err,data)=>err?res.writeHead(404).end():res.writeHead(200,{'content-type':name.endsWith('.js')?'application/javascript':'text/html'}).end(data));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(()=>localStorage.setItem('hlm_front_office_v8','M1610_DOM_SENTINEL'));
  await page.goto('http://127.0.0.1:'+server.address().port+'/hlm-phase11-isolated-single-game.html');
  await page.locator('#gm-m1610-blockers').waitFor();
  const result=await page.evaluate(()=>{
   const ids=[...document.querySelectorAll('[id]')].map(node=>node.id);
   const seen=new Set(),duplicates=[];
   for(const id of ids){if(seen.has(id))duplicates.push(id);seen.add(id)}
   const anchors=[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(Boolean);
   const brokenAnchors=anchors.filter(id=>!document.getElementById(id));
   return {duplicates:[...new Set(duplicates)],brokenAnchors:[...new Set(brokenAnchors)],totalIds:ids.length,
    panels:['gm-m1610-blockers','gm-next-action-heading','gm-season-trade','day-review'].map(id=>({id,present:!!document.getElementById(id)})),
    production:localStorage.getItem('hlm_front_office_v8')};
  });
  assert.deepEqual(result.duplicates,[],'Duplicate IDs in rendered workspace');
  assert.deepEqual(result.brokenAnchors,[],'Broken in-page navigation anchors');
  assert.ok(result.totalIds>0);
  assert.ok(result.panels.every(p=>p.present),'Missing consolidated GM panel');
  assert.equal(result.production,'M1610_DOM_SENTINEL');
  console.log('Mission 1610 mobile rendered DOM ID uniqueness, navigation, GM panel mounts and production isolation PASS');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
