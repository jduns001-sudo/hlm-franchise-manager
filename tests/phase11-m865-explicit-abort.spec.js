'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m865-explicit-abort.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('explicit abort after eight successful requests retains all four committed stores after restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m865-'));
 let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const pageFor=async phase=>{const page=await context.newPage();await page.goto(base+phase);return page};
 try{
  context=await launch();
  const seed=await pageFor('seed');await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');
  await seed.close();
  const aborted=await pageFor('abort');await expect(aborted.locator('body')).toHaveAttribute('data-stage','aborted');
  expect(JSON.parse(await aborted.locator('body').getAttribute('data-details'))).toMatchObject({retained:true,noCandidate:true,succeeded:8,abortCalled:true,completed:false,stores:['roster','contracts','draftPicks','history']});
  await context.close();context=null;
  context=await launch();
  const verify=await pageFor('verify');await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  expect(JSON.parse(await verify.locator('body').getAttribute('data-details'))).toMatchObject({retained:true,noCandidate:true});
 }finally{
  if(context)await context.close().catch(()=>{});
  fs.rmSync(profile,{recursive:true,force:true});
 }
});