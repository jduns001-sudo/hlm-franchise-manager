'use strict';
// Mission 1428: guard the existing playable loop without mutating production saves.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const html=fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-isolated-single-game.html'),'utf8');
const required={
 'new franchise':'new-franchise',
 'reload isolated save':'reload',
 'game-day review':'gm-game-day-review',
 'game-day approval':'gm-game-day-approve',
 'day review':'day-review',
 'human-approved simulation':'day-approve',
 'postgame review':'gm-postgame-review',
 'playoff qualification':'playoff-start',
 'playoff continuation':'playoff-next',
 'championship archive':'season-archive',
 'offseason review':'offseason-review',
 'next season approval':'next-season'
};
for(const [label,id] of Object.entries(required)){
 assert.match(html,new RegExp('<(?:button|select)[^>]*id="'+id+'"'),label+' control missing');
}
assert.match(html,/Existing isolated franchise cannot be overwritten/);
assert.match(html,/Reviewed day changed; review again/);
assert.match(html,/Existing Front Office saves remain untouched/);
assert.match(html,/Human GM: approve reviewed contracts/);
assert.match(html,/Human GM: approve isolated franchise day/);
assert.match(html,/Read-only GM postgame review opened/);
const tests=['hlm-phase11-reviewed-game-day-participation.test.js'];
for(const file of tests){
 const result=spawnSync(process.execPath,[file],{cwd:__dirname,encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,file+' failed:\n'+result.stdout+'\n'+result.stderr);
}
console.log('Mission 1428 playable-loop control and reviewed-participation Node gate passed');
