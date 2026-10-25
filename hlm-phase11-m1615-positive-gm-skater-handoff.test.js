'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
const bridge=fs.readFileSync('hlm-phase11-m1614-gm-game-day-review-bridge.js','utf8');
assert.match(html,/hlm-phase11-m1614-gm-game-day-review-bridge\.js/);
assert.ok(html.indexOf('hlm-phase11-m1603-gm-readiness-visible-panel.js')<html.indexOf('hlm-phase11-m1614-gm-game-day-review-bridge.js'));
for(const part of ['gm-upcoming-game-open','gm-game-day-review','GM-approved selection handed','root.confirm','JSON.stringify(readState())!==snap','review.click()','existing.click()','GM cancelled','No save'])assert.ok(bridge.includes(part),part);
assert.equal([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].length,1,'Keep single inline script');
console.log('Mission 1615 positive guarded GM-to-skater-review integration contracts PASS');