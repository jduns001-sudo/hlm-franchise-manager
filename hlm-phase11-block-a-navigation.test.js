'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-isolated-single-game.html'),'utf8');
assert.match(html,/<details class="block-a-menu" id="block-a-navigation">/);
assert.match(html,/<nav class="block-a-menu-grid" aria-label="Franchise game menu">/);
for(const target of ['gm-next-action-heading','gm-roster','game','gm-daily-brief','gm-draft-pick','season-dashboard','playoff-start','day-review']){
 assert.ok(html.includes('href="#'+target+'"'),'missing navigation link '+target);
 assert.ok(html.includes('id="'+target+'"'),'missing destination '+target);
}
assert.match(html,/\.block-a-menu summary\{cursor:pointer/);
assert.match(html,/min-height:44px/);
assert.match(html,/\.block-a-menu-grid a:focus-visible/);
assert.match(html,/id="new-franchise"/);
assert.match(html,/id="gm-workspace-day-confirm"/);
assert.match(html,/production Front Office save remains separate/);
console.log('Block A mobile navigation targets, accessible controls and isolated franchise safeguards passed');
