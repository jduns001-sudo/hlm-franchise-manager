'use strict';
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const suites = [
  'hlm-phase11-m1619-cpu-fixture-lifecycle.test.js',
  'hlm-phase11-m1620-cpu-fixture-history.test.js'
];
for (const file of suites) {
  assert.ok(fs.statSync(path.join(root,file)).isFile(), 'Required acceptance suite missing: '+file);
  const run=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,encoding:'utf8',timeout:120000});
  if(run.stdout) process.stdout.write(run.stdout);
  if(run.stderr) process.stderr.write(run.stderr);
  assert.equal(run.error,undefined,file+' could not run');
  assert.equal(run.status,0,file+' failed');
}
console.log('Mission 1621 combined deterministic CPU fixture lifecycle and visible history PASS');
