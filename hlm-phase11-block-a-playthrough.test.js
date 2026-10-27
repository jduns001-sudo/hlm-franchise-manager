'use strict';
// Consolidated integration acceptance using the real existing engine, not mocked success flags.
// Each suite runs in its own Node process. This test never opens or writes a production save.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {existsSync,readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=__dirname;
const suites=[
 ['full-season','hlm-phase11-full-season-acceptance.test.js'],
 ['two-season-contracts-draft','hlm-phase11-multiseason-continuity.test.js'],
 ['complete-season-journey','hlm-phase11-complete-season-journey.test.js'],
 ['real-universe-preview','hlm-phase11-real-universe-gameplay-acceptance.test.js'],
 ['new-franchise','hlm-phase11-new-franchise.test.js'],
 ['gameplay-bridge','hlm-phase11-gameplay-bridge.test.js'],
 ['isolated-save','hlm-phase11-isolated-single-game.test.js']
];
test('all seven existing integration suites remain present',()=>{
 for(const [,path] of suites)assert.equal(existsSync(join(root,path)),true,path);
});
for(const [name,path] of suites)test('integrated gate: '+name,()=>{
 const result=spawnSync(process.execPath,[join(root,path)],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024});
 assert.equal(result.error,undefined,result.error?.message);
 assert.equal(result.status,0,(result.stderr||'')+'\n'+(result.stdout||''));
});
test('front-office entry points stay isolated and production keys untouched by new runner',()=>{
 const index=readFileSync(join(root,'index.html'),'utf8');
 const isolated=readFileSync(join(root,'hlm-phase11-isolated-single-game.js'),'utf8');
 assert.match(index,/app\.html/);
 assert.match(index,/hlm-phase11-isolated-single-game\.html/);
 assert.match(isolated,/hlm-phase11-m1340-isolated-single-game-v1/);
 assert.doesNotMatch(readFileSync(__filename,'utf8'),/setItem\s*\(/);
});
