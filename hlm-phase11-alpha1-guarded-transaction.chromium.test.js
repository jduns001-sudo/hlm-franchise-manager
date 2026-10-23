'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {startServer,fixture,proposal}=require('./hlm-phase11-real-isolated-trade-bridge');
const {createGuardedTransaction}=require('./hlm-phase11-alpha1-guarded-transaction');
(async()=>{
 let raw=JSON.stringify(fixture()),writes=0,sequence=null;
 const storage={getItem:key=>{assert.equal(key,'alpha1-browser-isolated');return raw},setItem:()=>{writes++;throw Error('forbidden')}};
 const coordinator=createGuardedTransaction(storage,'alpha1-browser-isolated');
 const bridge={dispatch(action){
  if(action==='review'){const r=coordinator.review(proposal);sequence=r.reviewSequence;return r}
  if(action==='reload'){sequence=null;return coordinator.reload()}
  if(['approve','decline','cancel'].includes(action)){const n=sequence;sequence=null;return coordinator.decide(action,n)}
  return {status:'blocked',code:'unsupported-action',saved:false,settlementAuthorized:false};
 }};
 const server=await startServer(bridge),browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(server.url);assert.equal(await page.locator('#approve').isDisabled(),true);
  await page.locator('#review').click();await page.getByText('Review ready. GM decision required; settlement disabled.').waitFor();
  assert.match(await page.locator('#summary').innerText(),/Alpha/);
  assert.match(await page.locator('#summary').innerText(),/2028 round 1/);
  await page.locator('#decline').click();await page.getByText(/Decision decline: decline/).waitFor();
  await page.locator('#review').click();await page.getByText('Review ready. GM decision required; settlement disabled.').waitFor();
  await page.locator('#cancel').click();await page.getByText(/Decision cancel: cancel/).waitFor();
  await page.locator('#review').click();await page.getByText('Review ready. GM decision required; settlement disabled.').waitFor();
  await page.locator('#approve').click();await page.getByText(/settlement-disabled/).last().waitFor();
  await page.locator('#reload').click();await page.getByText('Review cleared. No save.').waitFor();
  assert.equal(await page.locator('#approve').isDisabled(),true);
  assert.equal(writes,0);assert.equal(raw,JSON.stringify(fixture()));
  assert.equal(await page.evaluate(()=>localStorage.length),0);
  await page.reload();assert.equal(await page.locator('#approve').isDisabled(),true);
 }finally{await browser.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
