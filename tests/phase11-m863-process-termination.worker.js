'use strict';
const {chromium}=require('@playwright/test');
(async()=>{
 const [profile,url]=process.argv.slice(2);
 const context=await chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 const page=await context.newPage();
 await page.goto(url);
 await page.waitForFunction(()=>document.body.dataset.stage==='pending'||document.body.dataset.stage==='failed',null,{timeout:30000});
 const result=await page.locator('body').getAttribute('data-stage');
 if(result!=='pending')throw Error('interrupt fixture failed: '+await page.locator('body').getAttribute('data-details'));
 if(process.send)process.send({type:'pending'});
 // Keep Chromium alive until the parent kills the entire process group.
 await new Promise(()=>{});
})().catch(error=>{if(process.send)process.send({type:'error',message:String(error)});process.exitCode=1});
