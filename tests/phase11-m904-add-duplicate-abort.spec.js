'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m904-add-duplicate-abort.html'));
let server,base;
test.beforeAll(async()=>{server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/?phase='});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('unhandled duplicate primary-key ConstraintError auto-aborts all four stores and persists after restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m904-'));let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const phase=async p=>{const page=await context.newPage();await page.goto(base+p);return page};
 try{
  context=await launch();
  const seed=await phase('seed');await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');
  expect(JSON.parse(await seed.locator('body').getAttribute('data-details'))).toEqual({valid:true,counts:[6,6,6,6],indexCounts:[6,6,6,6]});await seed.close();
  const abort=await phase('abort');await expect(abort.locator('body')).toHaveAttribute('data-stage','aborted');
  const result=JSON.parse(await abort.locator('body').getAttribute('data-details'));
  expect(result).toMatchObject({aborted:true,error:'ConstraintError',fullValid:true,counts:[6,6,6,6],indexCounts:[6,6,6,6]});
  expect(result.added).toBeGreaterThanOrEqual(1);
  await context.close();context=null;
  context=await launch();
  const verify=await phase('verify');await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  expect(JSON.parse(await verify.locator('body').getAttribute('data-details'))).toEqual({valid:true,counts:[6,6,6,6],indexCounts:[6,6,6,6],stores:['contracts','draftPicks','history','roster']});
 }finally{if(context)await context.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});