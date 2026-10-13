'use strict';
const {test,expect,chromium}=require('@playwright/test');
const fs=require('node:fs'),http=require('node:http'),os=require('node:os'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'phase11-m856-midtransaction.html'));
let server,base;
test.beforeAll(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port+'/?phase=';
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve))});
function rootPid(profile){
 const matches=fs.readdirSync('/proc').filter(n=>/^\d+$/.test(n)).filter(pid=>{
  try{
   const cmd=fs.readFileSync('/proc/'+pid+'/cmdline','utf8').replace(/\0/g,' ');
   return cmd.includes('--user-data-dir='+profile)&&!cmd.includes('--type=')&&/chrome|chromium/.test(cmd);
  }catch{return false}
 });
 if(matches.length!==1)throw Error('Expected one isolated Chromium root process; got '+matches.length);
 return Number(matches[0]);
}
test('SIGKILL during active uncommitted IndexedDB transaction rolls back candidate',async()=>{
 test.skip(process.platform!=='linux','Linux /proc isolation required');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hlm-m856-'));
 let context=null;
 async function launch(){return chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']})}
 async function visit(phase){
  const page=await context.newPage();
  await page.goto(base+phase);
  await expect(page.locator('body')).toHaveAttribute('data-stage',phase==='seed'?'seeded':'verified');
  const details=JSON.parse(await page.locator('body').getAttribute('data-details'));
  await page.close();return details;
 }
 try{
  context=await launch();
  await visit('seed');
  const pending=await context.newPage();
  await pending.goto(base+'pending');
  await expect(pending.locator('body')).toHaveAttribute('data-stage','pending');
  const pid=rootPid(profile);
  // Pending transaction is kept active by chained IDB requests; never allow oncomplete.
  expect(await pending.locator('body').getAttribute('data-stage')).toBe('pending');
  process.kill(pid,'SIGKILL');
  await new Promise(resolve=>setTimeout(resolve,1000));
  context=null;
  context=await launch();
  const result=await visit('verify');
  expect(result.originalIntact).toBe(true);
  expect(result.candidateAbsent).toBe(true);
 }finally{
  if(context)await context.close().catch(()=>{});
  fs.rmSync(profile,{recursive:true,force:true});
 }
});
