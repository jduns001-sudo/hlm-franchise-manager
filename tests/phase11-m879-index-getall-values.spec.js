'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m879-index-getall-values.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('indexed getAll returns complete duplicate-group values and preserves all franchise records after restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m879-'));let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const phase=async p=>{const page=await context.newPage();await page.goto(base+p);return page};
 const stores=['roster','contracts','draftPicks','history'];
 const value=(s,i)=>({store:s,id:i,group:Math.floor(i/3),revision:1,payload:'franchise-'+s+'-'+i});
 try{
  context=await launch();
  const seed=await phase('seed');await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');
  expect(JSON.parse(await seed.locator('body').getAttribute('data-details'))).toEqual({valid:true,counts:[12,12,12,12]});await seed.close();
  const query=await phase('query');await expect(query.locator('body')).toHaveAttribute('data-stage','queried');
  const data=JSON.parse(await query.locator('body').getAttribute('data-details'));
  expect(data).toMatchObject({indexValid:true,fullValid:true,counts:[12,12,12,12]});
  for(const s of stores)expect(data.found[s]).toEqual({all:Array.from({length:12},(_,i)=>value(s,i)),subset:[6,7,8].map(i=>value(s,i)),limited:[3,4,5,6].map(i=>value(s,i))});
  await context.close();context=null;
  context=await launch();
  const verify=await phase('verify');await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  expect(JSON.parse(await verify.locator('body').getAttribute('data-details'))).toEqual({fullValid:true,indexValid:true,counts:[12,12,12,12],stores:['contracts','draftPicks','history','roster']});
 }finally{if(context)await context.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});