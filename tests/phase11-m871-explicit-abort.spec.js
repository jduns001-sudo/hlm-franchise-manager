'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m871-explicit-abort.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('explicit transaction.abort rolls back staged updates across four stores after restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m871-'));let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const phase=async p=>{const page=await context.newPage();await page.goto(base+p);return page};
 try{
  context=await launch();
  const seed=await phase('seed');await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');await seed.close();
  const abort=await phase('abort');await expect(abort.locator('body')).toHaveAttribute('data-stage','aborted');
  expect(JSON.parse(await abort.locator('body').getAttribute('data-details'))).toMatchObject({aborted:true,baseline:true});
  await context.close();context=null;
  context=await launch();
  const verify=await phase('verify');await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  const state=JSON.parse(await verify.locator('body').getAttribute('data-details'));
  expect(state).toMatchObject({baseline:true,stores:['contracts','draftPicks','history','roster']});
  expect(state.rows).toEqual(['roster','contracts','draftPicks','history'].map(s=>({store:s,revision:1,payload:'franchise-'+s+'-v1'})));
 }finally{if(context)await context.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});