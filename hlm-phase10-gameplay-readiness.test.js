'use strict';
const assert = require('node:assert/strict');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {auditGameplayReadiness} = require('./hlm-phase10-gameplay-readiness');
assert.equal(auditGameplayReadiness(null).ready, false);
const state = createGameStateEnvelope({
  meta: {saveId:'test-save',controlledTeamId:1,currentDate:'2026-10-12'},
  teams:[{id:1,name:'Home'},{id:2,name:'Away'}],
  players:[{id:10,teamId:1}],
  games:[{id:'G1',status:'scheduled',homeTeamId:1,awayTeamId:2}]
});
const original = JSON.stringify(state);
const good = auditGameplayReadiness(state);
assert.equal(good.ready,true);
assert.equal(good.snapshot.scheduledGames,1);
assert.equal(good.snapshot.finalGames,0);
const completed=JSON.parse(original);
completed.activity.games[0].status='final';
const finishedAudit=auditGameplayReadiness(completed);
assert.equal(finishedAudit.ready,true);
assert.equal(finishedAudit.snapshot.scheduledGames,0);
assert.equal(finishedAudit.snapshot.finalGames,1);
assert.equal(good.snapshot.controlledTeamName,'Home');
assert.equal(JSON.stringify(state),original);
for(const [mutate,code] of [
  [s=>{s.meta.controlledTeamId=9},'CONTROLLED_TEAM_NOT_FOUND'],
  [s=>{s.meta.currentDate='2026-02-30'},'INVALID_CURRENT_DATE'],
  [s=>{s.meta.saveId=null},'MISSING_SAVE_ID'],
  [s=>{s.activity.games=[]},'NO_SEASON_GAMES']
]){
  const invalid=JSON.parse(original);mutate(invalid);
  const audit=auditGameplayReadiness(invalid);
  assert.equal(audit.ready,false);
  assert.ok(audit.issues.some(issue=>issue.code===code));
}
const malformed=JSON.parse(original);
malformed.activity.games=null;
assert.equal(auditGameplayReadiness(malformed).ready,false);
console.log('Phase 10 gameplay readiness tests passed');
