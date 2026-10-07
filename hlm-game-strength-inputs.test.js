'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createGameSimulationInput}=require('./hlm-game-simulation-foundation');
const {createGameStrengthSnapshot}=require('./hlm-game-strength-inputs');
const state=createGameStateEnvelope({meta:{currentDate:'2027-10-01'},players:[
{id:1,teamId:10,position:'C',retired:false,ovr:80},{id:2,teamId:10,position:'D',retired:false,ovr:78},{id:3,teamId:10,position:'G',retired:false,ovr:82},
{id:4,teamId:20,position:'LW',retired:false,ovr:79},{id:5,teamId:20,position:'RD',retired:false,ovr:77},{id:6,teamId:20,position:'G',retired:false,ovr:81},
{id:7,teamId:10,position:'RW',retired:true,ovr:99}
],games:[{id:'g1',seasonId:2027,homeTeamId:10,awayTeamId:20,date:'2027-10-01',status:'Scheduled'}]});
state.universe.games=state.activity.games;
const before=JSON.stringify(state);
const input=createGameSimulationInput(state,'g1');
const snapshot=createGameStrengthSnapshot(input,state,{teamInputs:{'10':{tactics:{identity:'balanced'},chemistry:{value:70}},'20':{fatigue:{value:15}}}});
assert.deepStrictEqual(snapshot.home.playerIds,[1,2,3]);
assert.deepStrictEqual(snapshot.home.forwards,[1]);assert.deepStrictEqual(snapshot.home.defense,[2]);assert.deepStrictEqual(snapshot.home.goalies,[3]);
assert.strictEqual(snapshot.home.tactics.identity,'balanced');assert.strictEqual(snapshot.home.strengthScore,null);
assert.strictEqual(snapshot.away.fatigue.value,15);assert.strictEqual(snapshot.formulaApplied,false);
assert.strictEqual(snapshot.simulationPerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Game strength input tests passed.');
