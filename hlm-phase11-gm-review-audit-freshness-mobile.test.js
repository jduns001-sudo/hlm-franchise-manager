'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {assessGMReviewAuditFreshness:assess}=require('./hlm-phase11-gm-review-audit-freshness');
(async()=>{const record={schemaVersion:1,status:'unchanged',checkedAtMs:1000,sha256:'a'.repeat(64),requiresFreshGMReview:false,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false};
const report=assess(JSON.stringify(record),1100,100);assert.equal(report.auditCurrent,true);
const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main></main></body></html>');
 await page.locator('main').evaluate((el,value)=>{const p=document.createElement('p');p.textContent='GM audit freshness: '+value;el.appendChild(p)},report.status);
 assert.match(await page.locator('main').innerText(),/GM audit freshness: current-read-only/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(report.gameplayActionAuthorized,false);assert.deepEqual(errors,[]);
 console.log('GM review audit freshness mobile Chromium passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
