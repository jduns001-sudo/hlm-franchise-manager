'use strict';
/* Read-only GitHub Pages deployment smoke. Never loads a browser, opens IndexedDB, or changes saves. */
const https=require('node:https');
const {URL}=require('node:url');
const target='https://jduns001-sudo.github.io/hlm-franchise-manager/';
function get(url,redirects=0){return new Promise((resolve,reject)=>{
 if(redirects>3)return reject(Error('Too many redirects'));
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||parsed.hostname!=='jduns001-sudo.github.io')return reject(Error('Unexpected deployment host'));
 const req=https.get(parsed,{headers:{'User-Agent':'HLM-Phase11-readonly-deployment-smoke','Accept':'text/html'}},res=>{
  if([301,302,307,308].includes(res.statusCode)){const location=res.headers.location;res.resume();if(!location)return reject(Error('Redirect missing location'));return get(new URL(location,url).href,redirects+1).then(resolve,reject)}
  if(res.statusCode!==200){res.resume();return reject(Error('Pages HTTP '+res.statusCode))}
  let data='',bytes=0;res.setEncoding('utf8');
  res.on('data',chunk=>{bytes+=Buffer.byteLength(chunk);if(bytes>4*1024*1024){req.destroy(Error('Response too large'));return}data+=chunk});
  res.on('end',()=>resolve({html:data,contentType:res.headers['content-type']||''}));
  res.on('error',reject);
 });req.setTimeout(20000,()=>req.destroy(Error('Pages request timed out')));req.on('error',reject);
})}
(async()=>{const {html,contentType}=await get(target);if(!contentType.includes('text/html'))throw Error('Pages did not serve HTML');
for(const marker of ['HLM27','Front Office','Command Center'])if(!html.includes(marker))throw Error('Front Office marker missing: '+marker);
if(/<script[^>]+src=["'][^"']*hlm-phase11-atomic-cutover\.js/i.test(html))throw Error('Production cutover script must not be loaded');
if(/HLM_PHASE11_SAVE_GUARD_OPT_IN\s*=\s*true/.test(html))throw Error('Normal-user guarded saves must remain disabled');
console.log('PASS: read-only Pages HTML reachable, Front Office markers present, production cutover/opt-in not activated');
})().catch(e=>{console.error('FAIL: '+e.message);process.exitCode=1});
