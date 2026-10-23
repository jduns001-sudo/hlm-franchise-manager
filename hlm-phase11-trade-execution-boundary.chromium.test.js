'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.route('http://localhost:1453/',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated trade boundary smoke</title><button id="cancel">Cancel</button><script>document.getElementById("cancel").onclick=()=>document.body.dataset.cancelled="true"</script>'}));
  await page.goto('http://localhost:1453/');
  const before=await page.evaluate(()=>{
   localStorage.setItem('hlm-phase11-mission1453-mobile-isolated',JSON.stringify({players:[{id:'a',teamId:1},{id:'b',teamId:2}]}));
   return localStorage.getItem('hlm-phase11-mission1453-mobile-isolated');
  });
  await page.locator('#cancel').click();
  assert.equal(await page.locator('body').getAttribute('data-cancelled'),'true');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm-phase11-mission1453-mobile-isolated')),before);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),null);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
