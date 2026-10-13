'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m854-restart.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('Chromium process restart with persistent profile retains original and unauthorized staging',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m854-'));
 let context;
 async function launch(){return chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']})}
 async function visit(phase){
  const page=await context.newPage();
  await page.goto(base+phase);
  await expect(page.locator('body')).toHaveAttribute('data-stage',phase==='seed'?'seeded':phase==='abort'?'aborted':phase==='stage'?'staged':'verified');
  const details=JSON.parse(await page.locator('body').getAttribute('data-details'));
  await page.close();return details;
 }
 try{
  context=await launch();
  await visit('seed');await visit('abort');
  let result=await visit('verify');
  expect(result.originalIntact).toBe(true);
  expect(result.candidatePresent).toBe(false);
  await visit('stage');
  await context.close();context=null; // End browser process; reuse the same on-disk profile.
  context=await launch();
  result=await visit('verify');
  expect(result.originalIntact).toBe(true);
  expect(result.candidatePresent).toBe(true);
  expect(result.journal).toEqual({authorized:false,phase:'staged'});
 }finally{
  if(context)await context.close();
  fs.rmSync(profile,{recursive:true,force:true});
 }
});
