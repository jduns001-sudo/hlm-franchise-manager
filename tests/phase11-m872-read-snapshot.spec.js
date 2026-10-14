'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m872-read-snapshot.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('readonly snapshot stays consistent while multi-store writer commits and survives restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m872-'));let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const phase=async p=>{const page=await context.newPage();await page.goto(base+p);return page};
 const rows=n=>['roster','contracts','draftPicks','history'].map(s=>({store:s,revision:n,payload:'franchise-'+s+'-v'+n}));
 try{
  context=await launch();
  const seed=await phase('seed');await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');await seed.close();
  const concurrent=await phase('concurrent');await expect(concurrent.locator('body')).toHaveAttribute('data-stage','consistent');
  const state=JSON.parse(await concurrent.locator('body').getAttribute('data-details'));
  expect(state).toMatchObject({oldComplete:true,writerComplete:true,oldConsistent:true,newConsistent:true});
  expect(state.oldRows).toEqual(rows(1));expect(state.newRows).toEqual(rows(2));
  await context.close();context=null;
  context=await launch();
  const verify=await phase('verify');await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  expect(JSON.parse(await verify.locator('body').getAttribute('data-details'))).toEqual({durable:true,rows:rows(2),stores:['contracts','draftPicks','history','roster']});
 }finally{if(context)await context.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});