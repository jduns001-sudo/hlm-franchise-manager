'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
for(const pattern of [/id="gm-daily-brief"/,/const nextDay=games\.map/,/const dayGames=games\.filter/,/const gmDayGames=dayGames\.filter/,/Your games next day:/,/Your next opponent:/,/manager\.reviewNextDay/,/manager\.advanceNextDay/,/navigator\.locks\.request/,/confirm\('Human GM/,/HLMIsolatedSeasonDashboard\.overview/])assert.match(html,pattern);
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
assert.doesNotThrow(()=>new Function(inline));
assert.ok(html.indexOf("const gmId=")<html.indexOf("const gmDayGames="));
console.log('Source-grounded GM daily brief, safety gates and script syntax passed');
