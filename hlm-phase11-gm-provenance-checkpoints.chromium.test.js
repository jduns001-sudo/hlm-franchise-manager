'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><main style="max-width:100%;overflow-wrap:anywhere"><h1>Human GM source provenance</h1><p id="warning">Independent verification required</p><div id="results"></div></main>');
 await page.addScriptTag({path:path.resolve('hlm-phase11-gm-provenance-checkpoints.js')});
 const r=await page.evaluate(()=>{const result=globalThis.HLMGMProvenanceCheckpoints.prepare({kind:'experimental-gm-human-evidence-review-ledger',entries:[{taskId:'A',sourceRequirement:'source'}]},[],true);document.querySelector('#results').textContent=result.entries[0].missingEvidence.join(', ');return result});
 assert.equal(r.productionActivationAllowed,false);
 assert.equal(r.entries[0].eligibility,'unknown');
 assert.match(await page.locator('#results').innerText(),/independent authenticity verification/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 console.log('Mission 1275 mobile Chromium passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});