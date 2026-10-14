'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m869-atomic-commit.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('single committed transaction updates all four franchise stores across browser restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m869-'));let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const phase=async p=>{const page=await context.newPage();await page.goto(base+p);return page};
 try{
  context=await launch();
  const seed=await phase('seed');await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');await seed.close();
  const commit=await phase('commit');await expect(commit.locator('body')).toHaveAttribute('data-stage','committed');
  expect(JSON.parse(await commit.locator('body').getAttribute('data-details'))).toMatchObject({before:true,after:true});
  await context.close();context=null;
  context=await launch();
  const verify=await phase('verify');await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  const state=JSON.parse(await verify.locator('body').getAttribute('data-details'));
  expect(state).toMatchObject({revision1:false,revision2:true,stores:['contracts','draftPicks','history','roster']});
  expect(state.rows).toEqual(['roster','contracts','draftPicks','history'].map(s=>({store:s,revision:2,payload:'franchise-'+s+'-v2'})));
 }finally{if(context)await context.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});