'use strict';
const assert=require('node:assert/strict');
const {createGameBatchDiagnosticsPanelController}=require('./hlm-phase9-browser-diagnostics-panel-controller');
function element(tag){
 return {tag,children:[],handlers:{},appendChild(child){this.children.push(child);},
 removeChild(child){this.children=this.children.filter(x=>x!==child);},
 setAttribute(key,value){this[key]=value;},addEventListener(name,fn){this.handlers[name]=fn;}};
}
const container=element('div'),documentRef={createElement:element};
const controller=createGameBatchDiagnosticsPanelController({container,documentRef});
assert.equal(controller.state,'idle');
assert.equal(controller.isOpen,false);
const originalCreate=documentRef.createElement;
documentRef.createElement=()=>{throw new Error('panel unavailable');};
assert.throws(()=>controller.open({json:'invalid'}),/panel unavailable/);
assert.equal(controller.state,'error');
assert.equal(controller.isOpen,false);
assert.deepEqual(controller.reset(),{state:'idle',isOpen:false});
assert.equal(controller.state,'idle');
documentRef.createElement=originalCreate;
const opened=controller.open({json:'invalid'});
assert.equal(opened.state,'attention');
assert.equal(opened.valid,false);
assert.equal(opened.buttonCount,4);
assert.equal(controller.isOpen,true);
assert.equal(container.children.length,1);
assert.deepEqual(controller.reset(),{state:'idle',isOpen:false});
assert.equal(container.children.length,0);
controller.open({json:'invalid'});
controller.open({json:'invalid'});
assert.equal(container.children.length,1);
assert.equal(controller.close(),true);
assert.equal(controller.close(),false);
assert.equal(controller.state,'idle');
assert.equal(controller.isOpen,false);
assert.equal(container.children.length,0);
assert.equal(controller.persistencePerformed,false);
console.log('Mission 552 diagnostics panel controller tests passed');
