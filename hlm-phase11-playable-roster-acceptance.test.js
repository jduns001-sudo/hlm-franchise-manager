'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const classify=require('./hlm-phase11-imported-team-classification.js'),bridge=require('./hlm-phase11-frontoffice-roster-bridge.js');
test('actual imported universe retains identity and team-scoped roster correctness',()=>{
const u=JSON.parse(fs.readFileSync('hlm-universe.json','utf8'));const before=JSON.stringify(u),team=u.teams.find(t=>u.players.some(p=>p.teamId===t.id&&!p.retired));assert.ok(team,'must find real team with active players');
const db={teams:u.teams,players:u.players,settings:{controlledTeamId:team.id}};
const p=bridge.preview(db,{humanApproved:true});const expected=u.players.filter(x=>!x.retired&&x.teamId===team.id).map(x=>String(x.id));const actual=p.universe.players.filter(x=>x.teamId===String(team.id)).map(x=>x.id);assert.deepEqual(actual,expected);assert.equal(p.meta.controlledTeamId,String(team.id));assert.equal(p.importedTeamClassification.excludedUnknownTeamCount,8518);assert.equal(p.importedTeamClassification.retiredUnknownTeam,4634);assert.equal(p.importedTeamClassification.activeUnknownTeam,3884);assert.equal(p.activationEnabled,false);assert.equal(p.productionWrite,false);assert.equal(JSON.stringify(u),before);
});
test('no automatic preview approval or save mutation',()=>{const ui=fs.readFileSync('hlm-phase11-frontoffice-roster-preview-ui.js','utf8');const app=fs.readFileSync('app.html','utf8');assert.match(ui,/humanApproved:true/);assert.match(ui,/approve\.addEventListener\('click'/);assert.doesNotMatch(ui,/localStorage|indexedDB|\.save\(/);assert.match(app,/HLM_PHASE11_SAVE_GUARD_OPT_IN!==true/);assert.ok(app.includes('<script src="./hlm-phase11-imported-team-classification.js"></script>'));});
