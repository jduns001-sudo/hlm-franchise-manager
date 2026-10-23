'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('hlm-phase11-mobile-office.html','utf8');
for(const id of ['office','team','calendar','assistant','menu']) {
 assert.match(html,new RegExp('id="'+id+'" class="panel"'),'panel '+id);
 assert.match(html,new RegExp('data-panel="'+id+'"'),'tab '+id);
}
for(const anchor of ['gm-next-action-heading','gm-game-day-workspace-heading','gm-roster','game','day-review'])assert.ok(html.includes('hlm-phase11-isolated-single-game.html#'+anchor),'guarded destination '+anchor);
assert.match(html,/No automatic saves/);
assert.match(html,/explicit human GM approval/);
assert.doesNotMatch(html,/localStorage\s*\.|sessionStorage\s*\.|\.setItem\s*\(|\.removeItem\s*\(|fetch\s*\(/,'navigation preview must not access or modify saves');
assert.match(html,/aria-current/);
console.log('Mission 1507A read-only mobile Office navigation contract passed');
