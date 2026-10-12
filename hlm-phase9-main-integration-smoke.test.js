'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const command = 'node hlm-phase9-diagnostics-recovery.test.js';
assert.ok(pkg.scripts && pkg.scripts.test && pkg.scripts.test.includes(command),
  'recovery regression must be included in npm test');
const html = fs.readFileSync(path.join(root,'phase9-diagnostics.html'),'utf8');
assert.match(html,/function invalidate\(message\)/,'inspection reset helper is deployed');
assert.match(html,/payload\.value!==approved/,'download rejects stale approval');
assert.match(html,/ticket!==revision/,'late file reads are ignored');
assert.match(html,/Package changed\. Select Inspect package/,'manual edits require reinspection');
const recovery = fs.readFileSync(path.join(root,'hlm-phase9-diagnostics-recovery.test.js'),'utf8');
assert.match(recovery,/valid package enables download/,'valid approval has regression coverage');
assert.match(recovery,/download refuses changed package/,'stale download has regression coverage');
assert.match(recovery,/reinspection restores approval/,'recovery has regression coverage');

// The standalone diagnostics tool must not silently acquire save or network access.
assert.match(html,/This page does not access or replace your active franchise save/);
assert.doesNotMatch(html,/(?:localStorage|sessionStorage|indexedDB)\s*\./,
  'diagnostics page must not access browser save stores');
assert.doesNotMatch(html,/\bfetch\s*\(|\bXMLHttpRequest\b/,
  'diagnostics page must not send network requests');
assert.doesNotMatch(html,/\b(?:put|post|patch|delete)\s*\(/i,
  'diagnostics page must not invoke write operations');

console.log('Mission 569 diagnostics integration and isolation checks passed');
