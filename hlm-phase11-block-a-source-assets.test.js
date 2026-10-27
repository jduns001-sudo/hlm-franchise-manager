'use strict';
// Block A source integrity contract: absence of source data must never be mistaken for gameplay completion.
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {teams,build}=require('./hlm-phase11-new-franchise');
const {createGameStateEnvelope,validateGameStateEnvelope}=require('./hlm-game-state');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
const {signDraftedProspect}=require('./hlm-phase11-drafted-prospect-signing');
const {inspect:reviewComposite}=require('./hlm-phase11-integrated-player-pick-trade');
const engine={createGameStateEnvelope,validateGameStateEnvelope,generateRoundRobinSchedule};
const source=JSON.parse(readFileSync(join(__dirname,'hlm-universe.json'),'utf8'));
test('canonical NHL starter preserves real player and draft source identities without fabricating contracts or prospects',()=>{
 const eligible=teams(source);
 assert.equal(eligible.length,32);
 const team=eligible.find(t=>t.abbr==='PIT');
 assert.ok(team);
 const state=build(source,team.id,engine);
 assert.equal(state.meta.controlledTeamId,team.id);
 assert.ok(state.universe.players.some(p=>String(p.teamId)===String(team.id)));
 assert.ok(state.assets.draftPicks.length>0);
 assert.equal(state.assets.contracts.length,0,'No fabricated contract data');
 assert.equal(state.universe.prospects.length,0,'No fabricated prospect data');
 assert.equal(state.extensions.phase11ExperimentalRosterAwareScores,false);
 const rosterIds=new Set(source.players.map(p=>String(p.id)));
 assert.ok(state.universe.players.every(p=>rosterIds.has(String(p.id))));
 assert.ok(state.assets.draftPicks.every(p=>p.source==='hlm-universe.json'));
 assert.equal(validateGameStateEnvelope(state).valid,true);
});
test('missing drafted prospect cannot be signed, and failed operation cannot change starter',()=>{
 const team=teams(source).find(t=>t.abbr==='PIT');
 const state=build(source,team.id,engine),snapshot=JSON.stringify(state);
 assert.throws(()=>signDraftedProspect(state,{prospectId:'unverified-prospect',teamId:team.id,contractId:'unverified-contract',aav:1000000,years:3,season:'2026-27',capLimit:100000000}),/missing or ambiguous/);
 assert.equal(JSON.stringify(state),snapshot);
});
test('composite player and pick trade must not succeed without source-backed contracts and CPU authority',()=>{
 const team=teams(source).find(t=>t.abbr==='PIT');
 const state=build(source,team.id,engine),snapshot=JSON.stringify(state);
 assert.throws(()=>reviewComposite(state,{outgoingPlayerId:'unverified',incomingPlayerId:'unverified',picks:[{pickId:'unverified',fromTeamId:team.id,toTeamId:1}]}));
 assert.equal(JSON.stringify(state),snapshot);
});
