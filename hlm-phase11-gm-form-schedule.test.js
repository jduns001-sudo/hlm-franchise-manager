'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
for(const p of [/const gmFinals=/,/\.slice\(0,5\)/,/const gmForm=/,/Number\.isFinite/,/const gmUpcoming=/,/\.slice\(0,3\)/,/Recent form \(newest first\):/,/Next 3 GM games:/,/manager\.reviewNextDay/,/manager\.advanceNextDay/,/navigator\.locks\.request/,/confirm\('Human GM/,/HLMIsolatedSeasonDashboard\.overview/])assert.match(html,p);
assert.doesNotThrow(()=>new Function([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]));
console.log('Controlled-team five-game form, three-game schedule and safety contracts passed');
