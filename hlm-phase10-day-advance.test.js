'use strict';
const assert = require('node:assert/strict');
const {createGameStateEnvelope} = require('./hlm-game-state');
const {prepareDayAdvance} = require('./hlm-phase10-day-advance');
const state = createGameStateEnvelope({
  meta: {saveId:'day-advance',currentDate:'2026-12-31',controlledTeamId:1},
  games: [
    {id:'next',status:'scheduled',date:'2027-01-01'},
    {id:'later',status:'scheduled',date:'2027-01-02'},
    {id:'done',status:'final',date:'2027-01-01'}
  ]
});
const before=JSON.stringify(state);
const result=prepareDayAdvance(state);
assert.equal(result.fromDate,'2026-12-31');
assert.equal(result.toDate,'2027-01-01');
assert.equal(result.nextState.meta.currentDate,'2027-01-01');
assert.deepEqual(result.scheduledGameIds,['next']);
assert.equal(JSON.stringify(state),before,'original save unchanged');
result.nextState.activity.games[0].id='changed';
assert.equal(state.activity.games[0].id,'next','nested save data not aliased');
assert.equal(prepareDayAdvance(result.nextState).toDate,'2027-01-02');
const invalid=createGameStateEnvelope({meta:{currentDate:'2026-02-30'}});
assert.throws(()=>prepareDayAdvance(invalid),{code:'INVALID_CALENDAR_DATE'});
assert.throws(()=>prepareDayAdvance(null),{code:'INVALID_GAME_STATE'});
console.log('Phase 10 one-day advancement candidate tests passed');
