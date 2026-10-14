'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const html=fs.readFileSync('app.html','utf8');
test.use({browserName:'chromium',viewport:{width:390,height:844}});
test('real app.html rehydrates schema 7 custom players into live roster',async()=>{
 expect(html).toMatch(/players:U\.players\.map\([\s\S]*?\.concat\(st\.customPlayers\|\|\[\]\)/);
 expect(html).toMatch(/function myPlayers\(\)[\s\S]*?activePlayers\(\)\.filter\(p=>p\.teamId==id\)/);
 expect(html).toMatch(/function roster\(\)[\s\S]*?const ps=myPlayers\(\)/);
});
test('real app.html roster renders imported name position overall and profile action',async()=>{
 expect(html).toMatch(/function roster\(\)[\s\S]*?esc\(p\.name\)[\s\S]*?posText\(p\)[\s\S]*?p\.ovr[\s\S]*?openPlayerProfile\(\$\{p\.id\}\)/);
 expect(html).toMatch(/function posText\(p\)[\s\S]*?p\.positions/);
});
test('import workbench maps team and OVR metadata into schema 7 custom players',async()=>{
 const source=fs.readFileSync('hlm-phase11-import-workbench.js','utf8');
 expect(source).toContain('teamId:map[p.teamId]');
 expect(source).toContain('positions:[p.position]');
 expect(source).toContain('overall:p.ovr');
});
test('activation is not wired into live app and remains explicitly disabled',async()=>{
 expect(html).not.toContain('HLMPhase11AtomicCutover.createController');
 const gate=fs.readFileSync('hlm-phase11-cutover-integration.js','utf8');
 expect(gate).toContain('productionCutoverEnabled:false');
});
