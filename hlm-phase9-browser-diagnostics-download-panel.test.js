'use strict';
const assert=require('node:assert/strict');
const {mountGameBatchDiagnosticsDownloadPanel}=require('./hlm-phase9-browser-diagnostics-download-panel');
const {prepareBrowserDiagnosticsDownloads}=require('./hlm-phase9-browser-diagnostics-download-adapter');
const mock=require('./hlm-phase9-browser-diagnostics-download-adapter');
function element(tag){
 return {tag,children:[],handlers:{},appendChild(child){this.children.push(child);},
 setAttribute(key,value){this[key]=value;},addEventListener(name,fn){this.handlers[name]=fn;},
 click(){if(this.handlers.click)this.handlers.click();}};
}
const container=element('div');
const documentRef={createElement:element};
assert.throws(()=>mountGameBatchDiagnosticsDownloadPanel({}),/container and browser document/);
const original=prepareBrowserDiagnosticsDownloads;
assert.equal(typeof original,'function');
console.log('Mission 546 diagnostics download panel interface tests passed');
