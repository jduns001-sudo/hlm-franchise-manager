'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
assert.match(html,/<nav aria-label="Season navigation">/);
for(const target of ['season-dashboard','day-review','game']){
 assert.match(html,new RegExp('href="#'+target+'"'));
 assert.match(html,new RegExp('id="'+target+'"'));
}
assert.match(html,/href="\.\/app\.html"/);
assert.match(html,/HLMIsolatedSeasonDashboard\.overview/);
assert.match(html,/manager\.reviewNextDay/);
assert.match(html,/manager\.advanceNextDay/);
assert.match(html,/navigator\.locks\.request/);
assert.match(html,/confirm\('Human GM/);
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1);
assert.doesNotThrow(()=>new Function(scripts[0][1]));
console.log('Mission 1343 navigation, existing approved-day workflow and safety contracts passed');
