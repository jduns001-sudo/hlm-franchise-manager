'use strict';
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const url='file://'+require('path').resolve(__dirname,'hlm-player-performance-comparison-insights-preview.html');
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('#result').waitFor();
  const initial=await page.locator('#result').innerText();
  if(!initial.includes('comparative')||!initial.includes('trendLeft'))throw Error('missing insight');
  await page.locator('#refresh').tap();
  if(await page.locator('#result').innerText()!==initial)throw Error('non-deterministic preview');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('mobile horizontal overflow');
  if(errors.length)throw Error(errors.join('; '));
  console.log('Mission 1147 mobile Chromium preview passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
