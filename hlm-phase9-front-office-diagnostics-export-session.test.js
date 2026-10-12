'use strict';
const assert=require('node:assert/strict');
const {createFrontOfficeDiagnosticsExportSession}=require('./hlm-phase9-front-office-diagnostics-export-session');
function element(tag){
 return {tag,children:[],handlers:{},appendChild(child){this.children.push(child);},
 removeChild(child){this.children=this.children.filter(x=>x!==child);},
 setAttribute(key,value){this[key]=value;},addEventListener(name,fn){this.handlers[name]=fn;}};
}
const container=element('div'),documentRef={createElement:element};
const session=createFrontOfficeDiagnosticsExportSession({container,documentRef});
assert.equal(session.visible,false);
assert.equal(session.status,'idle');
const view=session.show({reviewPackageJson:'invalid'});
assert.equal(view.valid,false);
assert.equal(view.state,'attention');
assert.equal(session.visible,true);
assert.equal(container.children.length,1);
assert.equal(session.hide(),true);
assert.equal(session.visible,false);
assert.equal(container.children.length,0);
session.show({reviewPackageJson:'invalid'});
assert.deepEqual(session.reset(),{state:'idle',isOpen:false});
assert.equal(container.children.length,0);
assert.equal(session.persistencePerformed,false);
console.log('Mission 555 Front Office diagnostics export session tests passed');
