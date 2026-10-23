'use strict';
// Mission 1505: ensure the isolated GM roster renders readable lines without changing source data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-isolated-single-game.html'),'utf8');
const match=html.match(/\$\('gm-roster'\)\.textContent=state\?[^;]+;/);
assert.ok(match,'controlled team roster rendering assignment must exist');
const expression=match[0];
assert.ok(expression.includes("rosterLines.join('\\n')"),'player rows must use newline escapes');
assert.ok(expression.includes("rightsLines.join('\\n')"),'rights rows must use newline escapes');
assert.ok(!expression.includes("'\\\\n'"),'literal backslash-n separators must not return');
assert.ok(expression.includes("String(p.position||'Unknown position')")===false,'do not introduce position data mutation into renderer');
assert.ok(html.includes("String(p.position||'Unknown position')"),'source-backed position fallback retained');
assert.ok(html.includes("(p.overall??p.ovr??'N/A')"),'source-backed overall fallback retained');
console.log('Mission 1505 roster rendering contract passed');
