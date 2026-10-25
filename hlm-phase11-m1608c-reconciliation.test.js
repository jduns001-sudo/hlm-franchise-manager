'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
const names=['m1608-visible-cpu-fixture-progress','m1609-gm-next-matchup-card','m1610-gm-fixture-blockers','m1611-gm-continuation-timeline','m1612-gm-recent-matchup-brief','m1613-gm-next-opponent-preview'];
for(const name of names){const src='./hlm-phase11-'+name+'.js';assert.equal(html.split('src="'+src+'"').length-1,1,'Retain exactly one target loader '+src);}
assert.equal([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].length,1,'Preserve legacy single inline script');
assert.equal(html.split('src="./hlm-phase11-m1608-real-isolated-settlement-boundary.js"').length-1,1,'Include fail-closed boundary loader exactly once');
assert.ok(!html.includes('hlm-phase11-m1608-atomic-isolated-trade.js')&&!html.includes('hlm-phase11-m1608-real-isolated-settlement-boundary.js'),'No settlement script activated');
const files=['.github/workflows/mission-1608-isolated-atomic-trade.yml','hlm-phase11-m1608-atomic-isolated-trade.chromium.test.js','hlm-phase11-m1608-atomic-isolated-trade.js','hlm-phase11-m1608-atomic-isolated-trade.test.js','hlm-phase11-m1608-real-isolated-settlement-boundary.chromium.test.js','hlm-phase11-m1608-real-isolated-settlement-boundary.js','hlm-phase11-m1608-real-isolated-settlement-boundary.test.js'];
for(const file of files)assert.ok(fs.existsSync(file),'Preserve source '+file);
const boundary=fs.readFileSync('hlm-phase11-m1608-real-isolated-settlement-boundary.js','utf8');assert.match(boundary,/atomicSettlementVerified:false/);assert.match(boundary,/productionActivated:false/);
assert.match(fs.readFileSync('hlm-phase11-m1608-atomic-isolated-trade.js','utf8'),/compareAndSwap/);
console.log('Mission 1608-C target loaders, source preservation, fail-closed boundary and production isolation PASS');
