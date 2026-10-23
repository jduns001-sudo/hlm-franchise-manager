'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const html=fs.readFileSync('hlm-phase11-integrated-trade-workspace.html','utf8');
  await page.route('http://localhost:1463/',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.goto('http://localhost:1463/');
  assert.equal(await page.locator('#approve').isDisabled(),true);
  await page.locator('#review').click();
  assert.match(await page.locator('#status').innerText(),/unavailable/);
  assert.equal(await page.locator('#approve').isDisabled(),true);
  const before=await page.evaluate(()=>{localStorage.setItem('hlm-phase11-isolated-1463','immutable');return localStorage.getItem('hlm-phase11-isolated-1463')});
  await page.addInitScript(()=>{
   window.HLMTradeWorkspace={
    review:()=>({status:'review-only',outgoing:{id:'a',name:'Alpha',teamId:'1',aav:4,tradePermission:'allowed'},incoming:{id:'b',name:'Bravo',teamId:'2',aav:5,tradePermission:'allowed'},picks:[{year:2028,round:1,originalTeamId:'1',currentOwner:'1',proposedOwner:'2'}],financialReviewed:true,restrictionsReviewed:true,saved:false,settlementAuthorized:false}),
    decide:action=>({code:action==='approve'?'settlement-disabled':action,saved:false,settlementAuthorized:false}),
    reload:()=>null
   };
  });
  await page.reload();
  await page.locator('#review').click();
  assert.match(await page.locator('#summary').innerText(),/Alpha/);
  assert.match(await page.locator('#summary').innerText(),/2028 round 1/);
  await page.locator('#decline').click();
  assert.match(await page.locator('#status').innerText(),/decline.*No save/);
  assert.equal(await page.locator('#approve').isDisabled(),true);
  await page.locator('#review').click();await page.locator('#cancel').click();
  assert.match(await page.locator('#status').innerText(),/cancel.*No save/);
  await page.locator('#review').click();await page.locator('#approve').click();
  assert.match(await page.locator('#status').innerText(),/settlement-disabled/);
  await page.locator('#reload').click();assert.equal(await page.locator('#approve').isDisabled(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm-phase11-isolated-1463')),before);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hlm_front_office_v8')),null);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
