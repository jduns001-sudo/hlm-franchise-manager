'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m864-blocked-upgrade.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('blocked version upgrade preserves committed franchise stores across browser restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m864-'));
 let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 try{
  context=await launch();
  const seed=await context.newPage();await seed.goto(base+'seed');
  await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');
  await seed.close();
  const blocked=await context.newPage();await blocked.goto(base+'block');
  await expect(blocked.locator('body')).toHaveAttribute('data-stage','blocked');
  expect(JSON.parse(await blocked.locator('body').getAttribute('data-details'))).toMatchObject({sawVersionChange:true,sawBlocked:true,upgradeStarted:false});
  // Close the entire browser while the old connection blocks the upgrade.
  await context.close();context=null;
  context=await launch();
  const check=await context.newPage();await check.goto(base+'verify');
  await expect(check.locator('body')).toHaveAttribute('data-stage','verified');
  expect(JSON.parse(await check.locator('body').getAttribute('data-details'))).toMatchObject({retained:true,version:1,noUpgrade:true});
 }finally{
  if(context)await context.close().catch(()=>{});
  fs.rmSync(profile,{recursive:true,force:true});
 }
});