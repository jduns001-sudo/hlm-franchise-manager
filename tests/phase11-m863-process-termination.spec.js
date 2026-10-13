'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m863-process-termination.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
test('Chromium process termination preserves committed multi-store snapshot',async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m863-'));
 let context,child;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 try{
  context=await launch();
  const seed=await context.newPage();
  await seed.goto(base+'seed');
  await expect(seed.locator('body')).toHaveAttribute('data-stage','committed');
  await context.close();context=null;
  child=cp.fork(path.join(__dirname,'phase11-m863-process-termination.worker.js'),[profile,base+'interrupt'],{detached:true,stdio:['ignore','pipe','pipe','ipc']});
  const pending=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('worker did not reach pending transaction')),45000);
   child.on('message',msg=>{if(msg.type==='pending'){clearTimeout(timeout);resolve(true)}else if(msg.type==='error'){clearTimeout(timeout);reject(Error(msg.message))}});
   child.once('exit',(code,signal)=>{clearTimeout(timeout);reject(Error('worker exited before kill: '+code+' '+signal))});
  });
  expect(pending).toBe(true);
  // Kill the worker and all Chromium descendants as a single OS process group.
  // Do not call browser.close(): this specifically exercises abrupt termination.
  process.kill(-child.pid,'SIGKILL');
  await new Promise(resolve=>child.once('exit',resolve));
  child=null;
  context=await launch();
  const verify=await context.newPage();
  await verify.goto(base+'verify');
  await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  expect(JSON.parse(await verify.locator('body').getAttribute('data-details'))).toMatchObject({retained:true,noCandidate:true,stores:['roster','contracts','draftPicks','history']});
 }finally{
  if(child){try{process.kill(-child.pid,'SIGKILL')}catch{}}
  if(context)await context.close().catch(()=>{});
  fs.rmSync(profile,{recursive:true,force:true});
 }
});
