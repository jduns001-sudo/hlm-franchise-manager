'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('phase9-diagnostics.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const controls={};
function element(){return {value:'',disabled:true,textContent:'',files:[],handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}};}
const document={getElementById(id){return controls[id]??(controls[id]=element());}};
vm.runInNewContext(script,{document,TextEncoder,Math,JSON,URL,Blob,setTimeout},{timeout:3000});
async function main(){
 let resolve;
 controls['package-file'].files=[{size:4,text:()=>new Promise(r=>{resolve=r;})}];
 const pending=controls['package-file'].handlers.change();
 controls.payload.value='manual edits';
 controls.payload.handlers.input();
 resolve('stale file contents');
 await pending;
 assert.equal(controls.payload.value,'manual edits');
 controls['package-file'].files=[{size:4,text:()=>new Promise(r=>{resolve=r;})}];
 const second=controls['package-file'].handlers.change();
 controls.clear.handlers.click();
 resolve('stale after clear');
 await second;
 assert.equal(controls.payload.value,'');
 assert.equal(controls.result.textContent,'No package inspected.');
 controls['package-file'].files=[{size:4,text:async()=>'{valid json}'}];
 await controls['package-file'].handlers.change();
 assert.equal(controls.payload.value,'{valid json}');
 assert.equal(controls.download.disabled,true);
 console.log('Mission 562 stale file read race tests passed');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
