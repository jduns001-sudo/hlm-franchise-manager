'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const suites=[
  'hlm-phase11-m1618-real-two-tab-guarded-fixture.chromium.test.js',
  'hlm-phase11-m1619-cpu-fixture-lifecycle.chromium.test.js',
  'hlm-phase11-m1620-cpu-fixture-history.chromium.test.js'
];
for(const file of suites){
  assert.ok(fs.statSync(path.join(__dirname,file)).isFile(),'Required mobile acceptance suite missing: '+file);
  const run=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:__dirname,encoding:'utf8',timeout:300000});
  if(run.stdout)process.stdout.write(run.stdout);
  if(run.stderr)process.stderr.write(run.stderr);
  assert.equal(run.error,undefined,file+' could not run');
  assert.equal(run.status,0,file+' failed');
}
console.log('Mission 1621 combined real-universe mobile approval, CPU final, visible history, reload, decline, two-tab stale guard and production isolation PASS');
