'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m888-index-cursor-continue-key.html'));
let server,base;
test.beforeAll(async()=>{server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/?phase='});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('index cursor continue(key) skips duplicate groups and survives Chromium restart',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m888-'));let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const phase=async p=>{const page=await context.newPage();await page.goto(base+p);return page};
 const stores=['roster','contracts','draftPicks','history'];
 const value=(s,i)=>({store:s,id:i,group:Math.floor(i/3),revision:1,payload:'franchise-'+s+'-'+i});
 try{
  context=await launch();
  const seed=await phase('seed');await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');
  expect(JSON.parse(await seed.locator('body').getAttribute('data-details'))).toEqual({valid:true,counts:[12,12,12,12]});await seed.close();
  const scanned=await phase('scan');await expect(scanned.locator('body')).toHaveAttribute('data-stage','scanned');
  const data=JSON.parse(await scanned.locator('body').getAttribute('data-details'));
  expect(data).toMatchObject({scanValid:true,fullValid:true,counts:[12,12,12,12]});
  for(const s of stores){const row=i=>({key:Math.floor(i/3),primaryKey:i,value:value(s,i)});expect(data.found[s]).toEqual({all:[0,6,7,9,10,11].map(row),bounded:[3,9,10,11].map(row),missing:[]})}
  await context.close();context=null;
  context=await launch();
  const verify=await phase('verify');await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  expect(JSON.parse(await verify.locator('body').getAttribute('data-details'))).toEqual({fullValid:true,scanValid:true,counts:[12,12,12,12],stores:['contracts','draftPicks','history','roster']});
 }finally{if(context)await context.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true})}
});