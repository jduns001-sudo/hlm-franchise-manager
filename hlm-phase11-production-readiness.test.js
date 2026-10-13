'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('app.html','utf8');
const guide=fs.readFileSync('PHASE11_PRODUCTION_INTEGRATION_READINESS.md','utf8');
const required=[
  /const DBNAME='hlm_front_office_v8'/,
  /const OLDDB='hlm_front_office_v5'/,
  /const STORE='state'/,
  /indexedDB\.open\(DBNAME,1\)/,
  /objectStore\(STORE\)\.get\('db'\)/,
  /objectStore\(STORE\)\.put\(state,'db'\)/,
  /function compactState\(\)/,
  /function downloadBackup\(\)/,
  /function restoreBackup\(inp\)/,
];
for(const pattern of required)assert.match(src,pattern,'Production save architecture drifted: '+pattern);
for(const phrase of ['Full-save backup','Explicit GM authorization','Rollback','NO GO','hlm_front_office_v8','hlm_front_office_v5'])assert(guide.includes(phrase),'Missing readiness requirement '+phrase);
const bridge=fs.readFileSync('hlm-phase11-browser-activation.js','utf8');
assert.match(bridge,/hlm-phase11-activation-backup-v1/);
assert.doesNotMatch(bridge,/indexedDB/,'Experimental source-pointer backup must not masquerade as production save backup');
console.log('Phase 11 production IndexedDB architecture and no-cutover readiness gate passed');
