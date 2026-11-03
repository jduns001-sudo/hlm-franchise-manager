'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const shell=require('./hlm-phase10-a1-shell.js');
const html=fs.readFileSync(path.join(__dirname,'hlm-phase11-isolated-single-game.html'),'utf8');

assert.deepEqual(shell.TABS.map(t=>t.label),['Home','Team','Season','Moves','More']);

// Every routing target emitted by the existing next-action logic has a route to an existing control.
const targets=[...html.matchAll(/nextTarget='([\w-]+)'/g)].map(m=>m[1]);
assert.ok(targets.length>=6);
for(const target of new Set(targets)){
 const route=shell.routeFor(target);
 assert.ok(shell.ROUTES[target],'missing route for '+target);
 assert.ok(shell.TABS.some(t=>t.id===route.tab));
 assert.ok(html.includes('id="'+route.focus+'"'),'route destination missing: '+route.focus);
}
assert.equal(shell.routeFor('unknown-target'),shell.ROUTES['season-dashboard']);

// Dashboard is built only from the verified snapshot and never invents values.
assert.deepEqual(shell.dashboardRows(null),[]);
assert.deepEqual(shell.dashboardRows({loaded:false}),[]);
const rows=Object.fromEntries(shell.dashboardRows({loaded:true,teamName:'Pittsburgh Penguins',date:'2026-10-01',players:25,draftRights:3,standing:{w:2,l:1,otl:1,points:5,gp:4},ownerFinals:4,ownerRemaining:78,nextGame:{date:'2026-10-02',home:'A',away:'B'},lastResult:'None',form:'',experimentalScores:false}));
assert.equal(rows.Team,'Pittsburgh Penguins');
assert.equal(rows.Record,'2-1-1 | 5 pts | GP 4');
assert.equal(rows['Roster-aware scores'],'Off by default');
assert.equal(shell.dashboardRows({loaded:true,teamName:'T',date:'d',players:0,draftRights:0,standing:null,ownerFinals:0,ownerRemaining:0,nextGame:null,experimentalScores:true}).find(r=>r[0]==='Roster-aware scores')[1],'GM enabled (experimental, nonofficial)');

// Page wiring: shell loads before the inline script, state event is read-only, and existing handlers stay.
assert.ok(html.indexOf('hlm-phase10-a1-shell.js')<html.lastIndexOf('<script>'));
assert.match(html,/document\.dispatchEvent\(new CustomEvent\('hlm:a1-state'/);
for(const id of ['day-review','day-approve','new-franchise','approve','gm-roster-scores','playoff-start','playoff-next','season-archive','next-season'])assert.ok(html.includes('id="'+id+'"'),id);
const src=fs.readFileSync(path.join(__dirname,'hlm-phase10-a1-shell.js'),'utf8');
assert.ok(!/\.click\(\)|localStorage|sessionStorage|innerHTML\s*=\s*[^'"]/.test(src.replace(/dash\.innerHTML='[^']*'/,'')),'shell must not click handlers, touch saves or inject dynamic HTML');
assert.ok(src.includes('id="a1-home-brief"')&&src.includes('href="#gm-daily-brief"')&&/function syncBrief\(\)\{[^}]*textContent=src\.textContent\}/.test(src),'Home brief is a read-only text copy linked to the existing brief');
assert.equal((html.match(/id="gm-daily-brief"/g)||[]).length,1,'brief element is not duplicated');
console.log('Phase 10 A1 shell routing, dashboard model and wiring passed');
