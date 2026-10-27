'use strict';
// Consolidated real Chromium franchise journey gate; no mock browser or production write.
// Each pre-existing browser acceptance suite starts its own disposable localhost server and context.
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {existsSync}=require('node:fs');
const path=require('node:path');
const suites=[
 ['real 32-team NHL franchise selection, GM decline/approve, reload and isolation','hlm-phase11-real-franchise-acceptance.chromium.test.js'],
 ['complete 12-game season in mobile browser with 12 GM approvals and reload','hlm-phase11-full-season-acceptance.chromium.test.js'],
 ['full franchise lifecycle: real-universe season, playoffs, offseason and continuity','hlm-phase11-franchise-lifecycle.chromium.test.js']
];
for(const [label,file] of suites){
 assert.equal(existsSync(path.join(__dirname,file)),true,'Missing required browser journey: '+file);
 const run=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:__dirname,encoding:'utf8',timeout:12*60*1000,maxBuffer:8*1024*1024});
 assert.equal(run.error,undefined,label+' process error: '+run.error?.message);
 assert.equal(run.status,0,label+' failed\n'+(run.stderr||'')+'\n'+(run.stdout||''));
 console.log('PASS browser integration: '+label);
}
console.log('BLOCK A BROWSER GATE PASSED: all three independently verified Chromium journeys');
