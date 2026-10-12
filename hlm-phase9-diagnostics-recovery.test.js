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
})().catch(error=>{console.error(error);process.exitCode=1;});

