'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'phase11-m857-atomicity.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fixture)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
function rootPid(profile){
 const matches=fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x)).filter(pid=>{
  try{const cmd=fs.readFileSync('/proc/'+pid+'/cmdline','utf8').replace(/\0/g,' ');
   return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&/chrome|chromium/.test(cmd);
  }catch{return false}
 });
 if(matches.length!==1)throw Error('Expected one isolated Chromium root process, found '+matches.length);
 return Number(matches[0]);
}
test('SIGKILL rolls back all four uncommitted franchise record changes',async()=>{
 test.skip(process.platform!=='linux','Linux process isolation required');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m857-'));
 let context;
 const launch=()=>chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 async function pageFor(phase){
  const page=await context.newPage();
  await page.goto(base+phase);
  return page;
 }
 try{
  context=await launch();
  const seed=await pageFor('seed');
  await expect(seed.locator('body')).toHaveAttribute('data-stage','seeded');
  await seed.close();
  const pending=await pageFor('pending');
  await expect(pending.locator('body')).toHaveAttribute('data-stage','pending');
  expect(JSON.parse(await pending.locator('body').getAttribute('data-detail')).queued).toBe(4);
  const pid=rootPid(profile);
  expect(await pending.locator('body').getAttribute('data-stage')).toBe('pending');
  process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1000));
  context=null;
  context=await launch();
  const verify=await pageFor('verify');
  await expect(verify.locator('body')).toHaveAttribute('data-stage','verified');
  const details=JSON.parse(await verify.locator('body').getAttribute('data-detail'));
  expect(details.unchanged).toBe(true);
  expect(details.noneChanged).toBe(true);
  expect(details.checked).toEqual(['roster','contracts','draftPicks','history']);
 }finally{
  if(context)await context.close().catch(()=>{});
  fs.rmSync(profile,{recursive:true,force:true});
 }
});
