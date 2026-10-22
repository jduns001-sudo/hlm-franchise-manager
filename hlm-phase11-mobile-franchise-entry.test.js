'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('workspace directory offers explicit isolated franchise entry without implicit save transfer',()=>{
 const index=fs.readFileSync('index.html','utf8');
 assert.match(index, /id="resume-isolated-franchise" href="\.\/hlm-phase11-isolated-single-game\.html"/);
 assert.match(index, /Existing isolated saves are loaded inside the season workspace/);
 assert.match(index, /if\(!tools\)location\.replace\('\.\/app\.html'\)/);
 const season=fs.readFileSync('hlm-phase11-isolated-single-game.html','utf8');
 assert.match(season,/id="reload"/);
 assert.match(season,/id="new-franchise"/);
 assert.match(season,/production Front Office save remains separate/);
});
