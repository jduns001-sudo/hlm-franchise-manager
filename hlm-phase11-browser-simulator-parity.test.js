'use strict';const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const {simulateGameScore}=require('./hlm-phase10-game-simulator');
const sandbox={};sandbox.globalThis=sandbox;vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'hlm-phase10-game-simulator-browser.js'),'utf8'),sandbox);const browser=sandbox.HLMPhase10BrowserSimulator.simulateGameScore;
for(const seed of [0,1,1314,4294967295])for(const id of ['g1','g2','playoff-7']){const input={gameId:id,homeTeamId:1,awayTeamId:2,seed};assert.deepEqual(JSON.parse(JSON.stringify(browser(input))),simulateGameScore(input))}
console.log('Browser/Node deterministic game score parity passed');
