'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {validateGMReviewDecisionAuditImport:validate}=require('./hlm-phase11-gm-review-decision-audit-import-validation');
(async()=>{const text=JSON.stringify({schemaVersion:1,status:'unchanged',checkedAtMs:1300,sha256:'a'.repeat(64),requiresFreshGMReview:false,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
const report=validate(text);assert.equal(report.valid,true);
const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main></main></body></html>');
 await page.locator('main').evaluate((el,value)=>{const p=document.createElement('p');p.textContent='Audit import: '+value;el.appendChild(p)},report.reason);
 assert.match(await page.locator('main').innerText(),/Audit import: validated-read-only/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(report.gameplayActionAuthorized,false);assert.deepEqual(errors,[]);
 console.log('GM review decision audit import validation mobile Chromium passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
