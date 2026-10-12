'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('phase9-diagnostics.html','utf8');
assert.match(html,/type="file" accept="\.json,application\/json"/);
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const controls={};
function element(){return {value:'',disabled:true,textContent:'',files:[],handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}};}
const document={getElementById(id){return controls[id]??(controls[id]=element());}};
vm.runInNewContext(script,{document,TextEncoder,Math,JSON,URL,Blob,setTimeout},{timeout:3000});
(async()=>{
 controls['package-file'].files=[{size:6*1024*1024,text:async()=>{throw Error('should not read');}}];
 await controls['package-file'].handlers.change();
 assert.match(controls.result.textContent,/5 MB limit/);
 controls['package-file'].files=[{size:12,text:async()=>'{bad'}];
 await controls['package-file'].handlers.change();
 assert.equal(controls.payload.value,'{bad');
 assert.equal(controls.download.disabled,true);
 assert.match(controls.result.textContent,/Select Inspect package/);
 console.log('Mission 560 diagnostics file upload tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
