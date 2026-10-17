'use strict';
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+require('path').resolve(__dirname,'hlm-player-performance-multimetric-preview.html'));
  if(await page.locator('.season').count()!==3)throw Error('initial seasons');
  if(!(await page.locator('#interpretation').innerText()).includes('Limited sample'))throw Error('confidence explanation');
  await page.locator('#metric').selectOption('finishing');
  await page.locator('#focus').selectOption('team');
  if((await page.locator('.season').first().innerText()).includes('Player finishing'))throw Error('focus filter');
  if(!(await page.locator('.season').first().innerText()).includes('Team finishing'))throw Error('metric filter');
  await page.locator('input[value="2027"]').uncheck();
  await page.locator('input[value="2028"]').uncheck();
  if(await page.locator('.season').count()!==1)throw Error('season filter');
  if(!(await page.locator('#interpretation').innerText()).includes('Human GM'))throw Error('authority disclaimer');
  await page.locator('input[value="2029"]').uncheck();
  if(await page.locator('.season').count()!==0)throw Error('empty state');
  if(!(await page.locator('#interpretation').innerText()).includes('No seasons selected'))throw Error('empty state explanation');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('horizontal overflow');
  if(errors.length)throw Error(errors.join('; '));
  console.log('Mission 1154 mobile comparison interactions passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
