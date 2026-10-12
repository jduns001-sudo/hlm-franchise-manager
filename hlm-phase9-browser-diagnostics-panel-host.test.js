'use strict';
const assert=require('node:assert/strict');
const {createGameBatchDiagnosticsPanelHost}=require('./hlm-phase9-browser-diagnostics-panel-host');
function element(tag){
 return {tag,children:[],handlers:{},appendChild(child){this.children.push(child);},
 removeChild(child){this.children=this.children.filter(x=>x!==child);},
 setAttribute(key,value){this[key]=value;},addEventListener(name,fn){this.handlers[name]=fn;},
 click(){if(this.handlers.click)this.handlers.click();}};
}
const container=element('div'),documentRef={createElement:element};
const host=createGameBatchDiagnosticsPanelHost({container,documentRef});
assert.equal(host.isMounted,false);
assert.equal(host.unmount(),false);
const first=host.mount({json:'invalid'});
assert.equal(first.valid,false);
assert.equal(host.isMounted,true);
assert.equal(container.children.length,1);
assert.throws(()=>host.mount({storage:{},json:Symbol('invalid')}));
assert.equal(host.isMounted,true);
assert.equal(container.children.length,1);
const second=host.mount({json:'invalid'});
assert.equal(first.dispose(),false);
assert.equal(second.valid,false);
assert.equal(container.children.length,1);
assert.equal(host.unmount(),true);
assert.equal(host.unmount(),false);
assert.equal(host.isMounted,false);
assert.equal(container.children.length,0);
assert.equal(host.persistencePerformed,false);
console.log('Mission 550 diagnostics panel host tests passed');
