'use strict';
// Mission 1626: reuse authoritative deterministic acceptance suites; no engine mutation.
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const suites=[
 'hlm-phase11-real-universe-journey.chromium.test.js',
 'hlm-phase11-full-season-acceptance.chromium.test.js',
 'hlm-phase11-multiseason-continuity.chromium.test.js',
 'hlm-phase11-m1618-real-two-tab-guarded-fixture.chromium.test.js',
 'hlm-phase11-m1620-cpu-fixture-history.chromium.test.js'
];
for(const file of suites){
 const full=path.join(__dirname,file);assert.ok(fs.statSync(full).isFile(),'Missing required suite: '+file);
 const run=spawnSync(process.execPath,[full],{cwd:__dirname,encoding:'utf8',timeout:180000});
 if(run.stdout)process.stdout.write(run.stdout);if(run.stderr)process.stderr.write(run.stderr);
 assert.equal(run.error,undefined,file+' execution error');assert.equal(run.status,0,file+' failed');
}
console.log('Mission 1626 mobile Chromium existing real-universe journey integration suites PASS');
