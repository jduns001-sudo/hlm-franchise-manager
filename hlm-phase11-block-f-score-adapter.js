'use strict';
// Test-only adapter: use the existing Phase 10 deterministic game simulator.
const {simulateGameScore}=require('./hlm-phase10-game-simulator');
const fs=require('node:fs');
try {
  const input=JSON.parse(fs.readFileSync(0,'utf8'));
  const result=simulateGameScore(input);
  process.stdout.write(JSON.stringify(result));
} catch(error) {
  process.stderr.write(String(error.message||error));
  process.exitCode=1;
}
