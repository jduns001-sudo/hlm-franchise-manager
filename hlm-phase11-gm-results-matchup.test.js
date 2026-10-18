'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
for(const p of [/const gmLast=/,/g\.status==='final'/,/String\(b\.date\)\.localeCompare\(String\(a\.date\)\)/,/Your latest result:/,/Your next matchup:/,/const gmNext=/,/manager\.reviewNextDay/,/manager\.advanceNextDay/,/navigator\.locks\.request/,/confirm\('Human GM/,/HLMIsolatedSeasonDashboard\.overview/])assert.match(html,p);
assert.doesNotThrow(()=>new Function([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]));
console.log('Latest GM result and next matchup reuse existing isolated schedule and safety gates');
