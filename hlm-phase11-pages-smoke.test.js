'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const https=require('node:https');
const base='https://jduns001-sudo.github.io/hlm-franchise-manager/';
const paths=['phase11-imported-franchise-preview.html','hlm-phase11-roster-validation.js','hlm-phase11-mobile-preview.js','phase11-activation-controls.html'];
const request=(url)=>new Promise((resolve,reject)=>{https.get(url,{timeout:15000,headers:{'User-Agent':'HLM-Phase11-Pages-Smoke'}},res=>{let body='';res.setEncoding('utf8');res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,body}));}).on('error',reject)});
(async()=>{for(const path of paths){assert(fs.existsSync(path),'Missing checked-in asset '+path);const response=await request(base+path);assert.equal(response.status,200,'Published asset '+path+' HTTP '+response.status);assert(response.body.length>100,'Published asset empty '+path);if(path.endsWith('.html'))assert.match(response.body,/Phase 11|phase11|Imported franchise|Experimental/i);if(path==='phase11-imported-franchise-preview.html'){assert.match(response.body,/hlm-phase11-roster-validation\.js/);assert.match(response.body,/id="warnings"/)}}console.log('Published Phase 11 experimental Pages assets HTTP 200 and preview markers verified')})().catch(e=>{console.error(e);process.exitCode=1});
