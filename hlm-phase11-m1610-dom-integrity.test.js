'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
const scripts=[...html.matchAll(/<script src="\\.\\/([^"]+)"><\\/script>/g)].map(m=>m[1]);
assert.equal(new Set(scripts).size,scripts.length,'Duplicate script loaders');
const required=['hlm-phase11-m1610-gm-fixture-blockers.js','hlm-phase11-m1608-unified-gm-preflight-refresh.js','hlm-phase11-m1608-actionable-cpu-blocker-review.js'];
for(const file of required){assert.equal(scripts.filter(s=>s===file).length,1,'Missing or duplicate '+file);assert.ok(fs.existsSync(file))}
assert.ok(!scripts.includes('hlm-phase11-m1608-atomic-isolated-trade.js'),'Settlement must remain default-off');
assert.match(html,/human GM|Human GM/);
console.log('Mission 1610 static GM panel loader, human authority and default-off trade contract PASS');
