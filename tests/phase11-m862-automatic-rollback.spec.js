'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m862-automatic-rollback.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('uncancelled ConstraintError automatically aborts all four stores and survives restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m862-'));
 let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 async function pageFor(phase){const page=await context.newPage();await page.goto(base+phase);return page}
 try{
  context=await launch();
  const seed=await pageFor('seed');
  await expect(seed.locator('body')).toHaveAttribute('data-stage','committed');
  await seed.close();
  const failure=await pageFor('failure');
  await expect(failure.locator('body')).toHaveAttribute('data-stage','rolled-back');
  const before=JSON.parse(await failure.locator('body').getAttribute('data-details'));
  expect(before).toMatchObject({requestFailed:true,aborted:true,completed:false,errorName:'ConstraintError',retained:true,noCandidate:true,stores:['roster','contracts','draftPicks','history']});
  await context.close();
  context=await launch();
  const verify=await pageFor('verify');
  await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  const after=JSON.parse(await verify.locator('body').getAttribute('data-details'));
  expect(after).toMatchObject({retained:true,noCandidate:true,stores:['roster','contracts','draftPicks','history']});
 }finally{
  if(context)await context.close().catch(()=>{});
  fs.rmSync(profile,{recursive:true,force:true});
 }
});
