'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m929-aborted-index-creation.html'));
let server,base;
test.beforeAll(async()=>{server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/?phase='});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('aborted four-store secondary index creation restores original indexes across Chromium restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m929-'));let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const phase=async p=>{const page=await context.newPage();await page.goto(base+p);return page};
 const expected=Array.from({length:4},()=>({valid:true,indexes:['group','revision']}));
 const stores=['contracts','draftPicks','history','roster'];
 try{
  context=await launch();
  const seed=await phase('seed');await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');
  expect(JSON.parse(await seed.locator('body').getAttribute('data-details'))).toEqual({version:1,stores});await seed.close();
  const abort=await phase('abort');await expect(abort.locator('body')).toHaveAttribute('data-stage','aborted');
  expect(JSON.parse(await abort.locator('body').getAttribute('data-details'))).toEqual({created:4,aborted:true,valid:true,results:expected,version:1,stores});
  await context.close();context=null;
  context=await launch();
  const verify=await phase('verify');await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  expect(JSON.parse(await verify.locator('body').getAttribute('data-details'))).toEqual({valid:true,results:expected,version:1,stores});
 }finally{if(context)await context.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});