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
console.log('Mission 564 diagnostics recovery regression checks passed');
