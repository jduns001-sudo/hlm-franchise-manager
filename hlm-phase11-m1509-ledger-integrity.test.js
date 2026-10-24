'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-m1508-browser-ledger.js'),'utf8');
test('CAS requires append-only history inside readwrite transaction',()=>{
 assert.match(src,/previous\.some/);assert.match(src,/incoming\.length!==previous\.length\+1/);
 assert.match(src,/incoming\.filter/);
});
test('guarded adapter stays separate from production save and settlement',()=>{
 assert.doesNotMatch(src,/localStorage|sessionStorage|transferPlayer|tradeSettlement/);
});
