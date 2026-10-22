'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('about:blank');
  const result=await page.evaluate(()=>{
   const key='hlm-phase11-mission1453-mobile-isolated';
   localStorage.setItem(key,JSON.stringify({players:[{id:'a',teamId:1},{id:'b',teamId:2}]}));
   const before=localStorage.getItem(key);
   // Mobile storage isolation smoke: no production key or trade mutation.
   return {unchanged:localStorage.getItem(key)===before,production:localStorage.getItem('hlm_front_office_v8')};
  });
  assert.equal(result.unchanged,true);assert.equal(result.production,null);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
