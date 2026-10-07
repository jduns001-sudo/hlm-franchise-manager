'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {executeDeterministicGameLoop}=require('./hlm-deterministic-game-loop');
const state=createGameStateEnvelope({games:[{id:'g1',homeTeamId:'H',awayTeamId:'A',date:'2026-10-07',status:'Scheduled'}],players:[
{id:1,teamId:'H',position:'C'},{id:2,teamId:'H',position:'D'},{id:3,teamId:'H',position:'G'},
{id:4,teamId:'A',position:'C'},{id:5,teamId:'A',position:'D'},{id:6,teamId:'A',position:'G'}]});
const resolver=x=>({outcome:x.unit<0.25?'goal':'save',danger:x.unit<0.33?'high':'medium'});
const a=executeDeterministicGameLoop(state,'g1',{deterministicSeed:'seed-1',eventCount:6,resolveEvent:resolver});
const b=executeDeterministicGameLoop(state,'g1',{deterministicSeed:'seed-1',eventCount:6,resolveEvent:resolver});
assert.strictEqual(a.simulationPerformed,true);assert.strictEqual(a.eventCount,6);assert.strictEqual(a.persistencePerformed,false);assert.strictEqual(a.scoreFinalized,false);
assert.deepStrictEqual(a.sequences.map(x=>[x.unit,x.attackingTeamId,x.sequence.terminalOutcome]),b.sequences.map(x=>[x.unit,x.attackingTeamId,x.sequence.terminalOutcome]));
assert.ok(a.sequences.every(x=>['H','A'].includes(x.attackingTeamId)));assert.throws(()=>executeDeterministicGameLoop(state,'g1',{}),e=>e.code==='GAME_SIMULATION_SEED_REQUIRED');
console.log('Deterministic game loop tests passed.');
