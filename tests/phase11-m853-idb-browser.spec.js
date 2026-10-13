'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'phase11-m853-idb-browser.html'));
let server,url;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 url='http://127.0.0.1:'+server.address().port+'/';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('real Chromium IndexedDB abort, reload and staged interruption preserve original',async({browser})=>{
 const context=await browser.newContext();
 const page=await context.newPage();
 async function phase(value){
  await page.goto(url+'?phase='+value);
  await expect(page.locator('body')).toHaveAttribute('data-stage',value==='seed'?'seeded':value==='abort'?'aborted':value==='stage'?'staged':'verified');
  return JSON.parse(await page.locator('body').getAttribute('data-result'));
 }
 await phase('seed');
 await phase('abort');
 let result=await phase('verify');
 expect(result.originalIntact).toBe(true);
 expect(result.candidatePresent).toBe(false);
 await phase('stage');
 await page.reload(); // Reload while candidate remains staged and unauthorized.
 result=await phase('verify');
 expect(result.originalIntact).toBe(true);
 expect(result.candidatePresent).toBe(true);
 expect(result.journal.authorized).toBe(false);
 await context.close();
});
