'use strict';
const assert=require('node:assert/strict');
const {assess,roundtripFixture}=require('./hlm-phase11-legacy-migration-assessment');
const {legacyV5,clone}=require('./hlm-phase11-m851-legacy-fixtures');
const baseline=JSON.stringify(legacyV5);
const copy=clone(legacyV5);
assert.equal(assess(copy).compatible,true);
assert.deepEqual(roundtripFixture(copy),copy);
for(const field of ['settings','roster','contracts','draftPicks','prospects','history','transactions','extraDraftPicks','customPlayers','playerOverrides','draftPickOverrides','decisions','lines','depth','draftBoard','waivers','notes'])assert.deepEqual(roundtripFixture(copy)[field],copy[field],field);
for(const mutate of [
 x=>{x.schema=999},x=>{delete x.settings.controlledTeamId},
 x=>{x.roster.push({...x.roster[0]})},
 x=>{delete x.contracts[0].playerId},
 x=>{delete x.draftPicks[0].ownerId}
]){const invalid=clone(copy);mutate(invalid);assert.equal(assess(invalid).compatible,false)}
// Model a staged crash without writing: original record remains untouched.
const original=clone(copy),staged=clone(copy);
staged.roster[0].overall=90;
const interrupted={original,staged,journal:{phase:'staged',authorized:false}};
assert.deepEqual(interrupted.original,copy);
assert.notDeepEqual(interrupted.staged,interrupted.original);
const recovered=clone(interrupted.original);
assert.deepEqual(recovered,copy);
assert.equal(JSON.stringify(legacyV5),baseline);
console.log('Mission 851 synthetic fixture fidelity and interrupted-stage recovery passed (no real browser migration)');
