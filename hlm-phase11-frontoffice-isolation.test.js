'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
test('experimental season remains isolated from production Front Office',()=>{
 const app=fs.readFileSync(path.join(__dirname,'app.html'),'utf8');
 const demo=fs.readFileSync(path.join(__dirname,'hlm-phase11-season-ledger.html'),'utf8');
 const journal=fs.readFileSync(path.join(__dirname,'hlm-phase11-isolated-journal.js'),'utf8');
 const guard=fs.readFileSync(path.join(__dirname,'hlm-phase11-isolated-tab-guard.js'),'utf8');
 assert.ok(app.length>1000,'real Front Office must be present');
 assert.doesNotMatch(app,/hlm-phase11-isolated-tab-guard\.js|hlm-phase11-season-ledger-session\.js/,'no experimental activation in production app');
 assert.match(demo,/Human-approved two-day season demo/);
 assert.match(demo,/guard\.saveApproved\(true/);
 assert.match(demo,/No production save access or activation/);
 assert.match(journal,/hlm-phase11-experimental-journal-v1/);
 assert.match(guard,/Human GM approval required/);
 assert.match(guard,/Stale isolated revision/);
});
