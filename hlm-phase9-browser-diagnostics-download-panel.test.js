'use strict';
const assert=require('node:assert/strict');
const {mountGameBatchDiagnosticsDownloadPanel}=require('./hlm-phase9-browser-diagnostics-download-panel');
function element(tag){
 return {tag,children:[],handlers:{},appendChild(child){this.children.push(child);},
 setAttribute(key,value){this[key]=value;},addEventListener(name,fn){this.handlers[name]=fn;},
 click(){if(this.handlers.click)this.handlers.click();}};
}
const container=element('div');
const documentRef={createElement:element};
assert.throws(()=>mountGameBatchDiagnosticsDownloadPanel({}),/container and browser document/);
const result=mountGameBatchDiagnosticsDownloadPanel({
 container,documentRef,diagnosticsArgs:{json:'invalid'}});
assert.equal(result.valid,false);
assert.equal(result.buttonCount,4);
assert.equal(result.persistencePerformed,false);
const panel=container.children[0];
assert.equal(panel['aria-label'],'GM review diagnostics exports');
const status=panel.children.find(child=>child.tag==='p');
assert.equal(status.role,'status');
assert.equal(status['aria-live'],'polite');
const buttons=panel.children.filter(child=>child.tag==='button');
assert.equal(buttons.length,4);
assert.ok(buttons.every(button=>button.type==='button'&&button.disabled===true));
for(const button of buttons)button.click();
console.log('Mission 547 diagnostics panel safety tests passed');
