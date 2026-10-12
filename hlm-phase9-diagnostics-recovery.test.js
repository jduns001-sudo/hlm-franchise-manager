'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, 'phase9-diagnostics.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, 'diagnostics script exists');
const ids = ['payload','result','download','package-file','inspect','clear'];
const elements = Object.fromEntries(ids.map(id => [id, {
 value: '', textContent: '', disabled: id === 'download', files: [],
 handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; },
 click() { if(this.handlers.click) return this.handlers.click(); }
}]));
const context = {
 document: { getElementById: id => elements[id] },
 TextEncoder, Math, JSON, Blob, URL: {createObjectURL(){return 'blob:test'}, revokeObjectURL(){}},
 setTimeout() {}
};
vm.runInNewContext(script[1], context);
const payload=elements.payload, result=elements.result, download=elements.download;
function inspect(value) {payload.value=value; elements.inspect.click();}
function assertBlocked(label) {assert.equal(download.disabled,true,label);assert.match(result.textContent,/Inspect|failed|changed|No package/i,label);}
inspect('{broken');
assertBlocked('malformed JSON');
inspect('{}');
assertBlocked('wrong package type');
payload.value='edited';
payload.handlers.input();
assertBlocked('manual edit invalidates inspection');
elements.clear.click();
assertBlocked('clear invalidates inspection');
assert.equal(payload.value,'');

// A verified package must become downloadable, then lose approval on any edit.
const {fingerprintGameBatchAuditReview:fingerprint}=require('./hlm-phase9-batch-audit-review-manifest');
const files={'diagnostics.json':JSON.stringify({valid:true}),'diagnostics.csv':'name,value\\nA,1','diagnostics.txt':'valid'};
const manifest={valid:true,jsonFingerprint:fingerprint(files['diagnostics.json']),csvFingerprint:fingerprint(files['diagnostics.csv']),textFingerprint:fingerprint(files['diagnostics.txt'])};
const validPackage=JSON.stringify({kind:'phase9-game-batch-audit-review-diagnostics-package',version:1,valid:true,files,manifest});
inspect(validPackage);
assert.equal(download.disabled,false,'valid package enables download');
payload.value=validPackage+' ';
download.click();
assertBlocked('download refuses changed package even without input event');
inspect(validPackage);
assert.equal(download.disabled,false,'reinspection restores approval');
payload.handlers.input();
assertBlocked('editing previously approved package disables download');

console.log('Mission 566 diagnostics recovery positive and negative checks passed');

// Local file selection invalidates prior approval before its asynchronous read completes.
(async () => {
  inspect(validPackage);
  assert.equal(download.disabled,false,'fixture approved before file selection');
  let resolveRead;
  const pending = new Promise(resolve => { resolveRead=resolve; });
  elements['package-file'].files=[{size:validPackage.length,text:()=>pending}];
  const change=elements['package-file'].handlers.change();
  assert.equal(download.disabled,true,'new file selection revokes approval immediately');
  assert.match(result.textContent,/Reading local file/);
  resolveRead(validPackage);
  await change;
  assert.equal(payload.value,validPackage,'file content loaded');
  assert.equal(download.disabled,true,'loaded file still requires explicit inspection');
  inspect(payload.value);
  assert.equal(download.disabled,false,'inspection restores download after loading');
  elements.clear.click();
  assert.equal(download.disabled,true,'clear revokes approval after file selection');
  console.log('Mission 570 file selection recovery checks passed');
  let finishOld, finishNew;
  const oldRead=new Promise(resolve=>{finishOld=resolve;});
  const newRead=new Promise(resolve=>{finishNew=resolve;});
  elements['package-file'].files=[{size:100,text:()=>oldRead}];
  const first=elements['package-file'].handlers.change();
  elements['package-file'].files=[{size:100,text:()=>newRead}];
  const second=elements['package-file'].handlers.change();
  finishNew('{"new":true}');
  await second;
  assert.equal(payload.value,'{"new":true}','newer selection loaded');
  finishOld('{"old":true}');
  await first;
  assert.equal(payload.value,'{"new":true}','older read ignored');
  assert.equal(download.disabled,true,'new file remains unapproved');
  console.log('Mission 571 out-of-order file read checks passed');
  // A failed current read reports an error without approving or retaining stale content.
  elements['package-file'].files=[{size:100,text:()=>Promise.reject(new Error('disk unavailable'))}];
  const failed=elements['package-file'].handlers.change();
  await failed;
  assert.equal(payload.value,'','failed latest read clears stale payload');
  assert.match(result.textContent,/Unable to read file: disk unavailable/);
  assert.equal(download.disabled,true,'failed read cannot be downloaded');
  // A stale rejected read cannot clear a newer successfully loaded package.
  let rejectOld;
  const staleFailure=new Promise((resolve,reject)=>{rejectOld=reject;});
  elements['package-file'].files=[{size:100,text:()=>staleFailure}];
  const oldFailure=elements['package-file'].handlers.change();
  elements['package-file'].files=[{size:100,text:()=>Promise.resolve('{"latest":true}')}];
  const latest=elements['package-file'].handlers.change();
  await latest;
  rejectOld(new Error('old read failed'));
  await oldFailure;
  assert.equal(payload.value,'{"latest":true}','stale read failure leaves newer payload intact');
  assert.match(result.textContent,/File loaded/,'stale failure does not replace success message');
  assert.equal(download.disabled,true,'latest payload requires inspection');
  console.log('Mission 572 stale file failure recovery checks passed');
  // Clearing during a pending file read must keep the workspace empty.
  let resolveAfterClear;
  const pendingClear=new Promise(resolve=>{resolveAfterClear=resolve;});
  elements['package-file'].files=[{size:100,text:()=>pendingClear}];
  const clearRead=elements['package-file'].handlers.change();
  elements.clear.click();
  assert.equal(payload.value,'','clear empties workspace immediately');
  resolveAfterClear(validPackage);
  await clearRead;
  assert.equal(payload.value,'','late file read cannot repopulate cleared workspace');
  assert.equal(result.textContent,'No package inspected.','clear status remains visible');
  assert.equal(download.disabled,true,'cleared workspace cannot download');
  console.log('Mission 573 clear-during-read checks passed');
  // Manual edits during a pending read take precedence over the delayed file.
  let resolveAfterEdit;
  const pendingEdit=new Promise(resolve=>{resolveAfterEdit=resolve;});
  elements['package-file'].files=[{size:100,text:()=>pendingEdit}];
  const editRead=elements['package-file'].handlers.change();
  payload.value='{"manual":true}';
  payload.handlers.input();
  resolveAfterEdit(validPackage);
  await editRead;
  assert.equal(payload.value,'{"manual":true}','delayed read cannot overwrite manual edit');
  assert.match(result.textContent,/Package changed/,'edit message remains visible');
  assert.equal(download.disabled,true,'manual edits require inspection');
  console.log('Mission 574 edit-during-read checks passed');
  // Inspection while a read is pending invalidates that read's revision.
  let resolveAfterInspect;
  const pendingInspect=new Promise(resolve=>{resolveAfterInspect=resolve;});
  payload.value=validPackage;
  elements['package-file'].files=[{size:100,text:()=>pendingInspect}];
  const inspectRead=elements['package-file'].handlers.change();
  elements.inspect.click();
  assert.equal(download.disabled,false,'current valid payload can be inspected');
  assert.match(result.textContent,/PACKAGE FINGERPRINTS VERIFIED/);
  resolveAfterInspect('{"outdated":true}');
  await inspectRead;
  assert.equal(payload.value,validPackage,'late read cannot replace inspected payload');
  assert.equal(download.disabled,false,'stale read cannot revoke current approval');
  assert.match(result.textContent,/PACKAGE FINGERPRINTS VERIFIED/,'verified status remains');
  console.log('Mission 575 inspect-during-read checks passed');





})().catch(error=>{console.error(error);process.exitCode=1;});



