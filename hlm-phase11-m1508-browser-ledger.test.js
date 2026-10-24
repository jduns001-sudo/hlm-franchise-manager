'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-m1508-browser-ledger.js'),'utf8');
const ledger=require('./hlm-phase11-m1508-browser-ledger.js');
test('browser storage module is parseable and exports isolated adapter',()=>{
 assert.equal(typeof ledger.open,'function');assert.equal(typeof ledger.read,'function');
 assert.equal(typeof ledger.compareAndSwap,'function');
 assert.match(ledger.NAME,/experiment-m1508/);
});
test('never touches localStorage, production keys or player trade state',()=>{
 assert.doesNotMatch(src,/localStorage|sessionStorage|hlm-phase11-production-save|tradeSettlement|transferPlayer/);
});
test('fails closed without IndexedDB and on invalid transition',async()=>{
 await assert.rejects(ledger.read(),/indexeddb-unavailable/);
 const r=await ledger.compareAndSwap({expectedRevision:0,nextLedger:{},fingerprint:'bad'});
 assert.equal(r.committed,false);
});
