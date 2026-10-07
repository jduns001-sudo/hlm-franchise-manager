'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');
const {createDailyGameSimulationCandidate,verifyDailyGameSimulationCandidate}=require('./hlm-game-timeline-integration');
const state=createGameStateEnvelope({meta:{currentDate:'2026-10-07'},games:[
{id:'g1',homeTeamId:'H',awayTeamId:'A',date:'2026-10-07',status:'Scheduled'},
{id:'g2',homeTeamId:'B',awayTeamId:'C',date:'2026-10-08',status:'Scheduled'}]});const before=JSON.stringify(state);
const candidate=createDailyGameSimulationCandidate(state,'2026-10-07',{games:{g1:{deterministicSeed:'day-g1',eventCount:3,resolveEvent:x=>({outcome:x.index===0?'goal':'save'})}}});
const check=verifyDailyGameSimulationCandidate(state,candidate);assert.strictEqual(JSON.stringify(state),before);assert.strictEqual(candidate.gamesProcessed,1);
assert.strictEqual(candidate.state.activity.games.find(g=>g.id==='g1').status,'Played');assert.strictEqual(candidate.state.activity.games.find(g=>g.id==='g2').status,'Scheduled');
assert.strictEqual(candidate.gameSimulationPerformed,true);assert.strictEqual(candidate.persistencePerformed,false);assert.strictEqual(check.valid,true);
assert.throws(()=>createDailyGameSimulationCandidate(state,'2026-10-07',{}),e=>e.code==='DAILY_GAME_SEED_REQUIRED');
console.log('Game timeline integration tests passed.');
