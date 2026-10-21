'use strict';
// Mission 1440: inspect source provenance before importing assets into an official franchise.
// This is deliberately read-only: salary snapshots, raw rookie rows and ambiguous picks
// must never be silently converted into contracts, prospects or owned draft selections.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'hlm-universe.json'),'utf8'));
const {build,teams}=require('./hlm-phase11-new-franchise');
const engine=require('./hlm-phase10-browser-engine');
assert.ok(Array.isArray(source.players)&&source.players.length>0);
assert.ok(Array.isArray(source.draftPicks)&&source.draftPicks.length>0);
assert.ok(Array.isArray(source.rookies)&&source.rookies.length>0);
assert.ok(!Array.isArray(source.contracts),'salary snapshot is not a canonical contract ledger');
assert.ok(!Array.isArray(source.prospects),'raw rookie rows are not canonical prospect records');
const missingPickIds=source.draftPicks.filter(p=>p.pickId==null&&p.id==null);
assert.ok(missingPickIds.length>0,'raw picks lack stable selection IDs');
const teamIds=new Set(source.teams.map(t=>String(t.id)));
const unresolvedOwners=source.draftPicks.filter(p=>!teamIds.has(String(p.teamId)));
assert.ok(unresolvedOwners.length>0,'raw picks include unresolved owners');
const candidate=teams(source)[0];assert.ok(candidate,'canonical active team required');
const game=build(source,candidate.id,engine);
assert.ok(game.universe.players.length>0);
assert.deepEqual(game.assets.contracts,[],'never fabricate contracts from AAV snapshots');
assert.deepEqual(game.assets.draftPicks,[],'never assign ambiguous draft picks');
assert.deepEqual(game.universe.prospects,[],'never promote raw rookie rows without identity validation');
console.log('Mission 1440 source audit passed: '+source.players.length+' players; '+source.draftPicks.length+' raw picks ('+missingPickIds.length+' missing IDs, '+unresolvedOwners.length+' unresolved owners); '+source.rookies.length+' raw rookies; zero invented assets.');
