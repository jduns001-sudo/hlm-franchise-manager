'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
const scripts=[...html.matchAll(/<script src="\.\/([^"]+)"><\/script>/g)].map(m=>m[1]);
const original=['hlm-phase11-m1607-visible-cpu-fixture-list.js','hlm-phase11-m1608-visible-cpu-fixture-progress.js','hlm-phase11-m1609-gm-next-matchup-card.js','hlm-phase11-m1610-gm-fixture-blockers.js','hlm-phase11-m1611-gm-continuation-timeline.js','hlm-phase11-m1612-gm-recent-matchup-brief.js','hlm-phase11-m1613-gm-next-opponent-preview.js','hlm-phase11-m1614-gm-game-day-review-bridge.js','hlm-phase11-m1616-persisted-gm-skater-handoff.js'];
const added=['hlm-phase11-m1608-real-isolated-settlement-boundary.js','hlm-phase11-m1608-unified-gm-preflight-refresh.js','hlm-phase11-m1608-actionable-cpu-blocker-review.js'];
for(const name of [...original,...added]){assert.equal(scripts.filter(x=>x===name).length,1,'Missing or duplicate loader: '+name);assert.ok(fs.existsSync(name),'Missing source: '+name)}
assert.ok(scripts.indexOf(added[0])>scripts.indexOf(original.at(-1)),'Must preserve original loader order');
assert.ok(scripts.indexOf(added[1])<scripts.indexOf(added[2]),'Refresh must precede blocker review');
assert.ok(!scripts.some(x=>x==='hlm-phase11-m1608-atomic-isolated-trade.js'),'Settlement cannot auto-load');
const boundary=fs.readFileSync(added[0],'utf8');
assert.match(boundary,/fail.closed/i);
assert.match(boundary,/compareAndSwap|CAS/);
assert.match(boundary,/CPU/);
assert.match(html,/Human GM|human GM/);
assert.equal((html.match(/<script>([\s\S]*?)<\/script>/g)||[]).length,1);
console.log('Mission 1609 loader preservation, GM control and fail-closed boundary contract passed');
