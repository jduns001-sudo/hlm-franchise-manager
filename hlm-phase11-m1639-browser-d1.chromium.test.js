'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs');
const {createHandler}=require('./hlm-phase11-m1639-browser-d1-bridge');
(async()=>{
 const handler=createHandler({db:{prepare(){throw Error('D1 forbidden in disabled fixture')}},fixture:{slot:'test'},enabled:false});
 const html=fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-m1639-browser-d1.html'),'utf8');
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/'){res.writeHead(200,{'content-type':'text/html'});res.end(html);return}
  const result=await handler({method:req.method,path:req.url});
  res.writeHead(result.status,{'content-type':'application/json'});res.end(JSON.stringify(result.body));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.evaluate(()=>localStorage.setItem('hlm_front_office_v8','PRODUCTION_SENTINEL'));
  await page.getByRole('button',{name:'Decline'}).click();
  assert.equal(await page.getByRole('button',{name:'Approve reviewed trade'}).isDisabled(),true);
  await page.reload();
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),'PRODUCTION_SENTINEL');
  assert.equal(await page.getByRole('button',{name:'Approve reviewed trade'}).isDisabled(),true);
  console.log('Mission 1639 disabled-default mobile HTTP isolation PASS');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
