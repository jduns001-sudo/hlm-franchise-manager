'use strict';
// Test-only source-backed multi-game projection; no storage or production writes.
const fs=require('node:fs');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');
const {calculateStandings}=require('./hlm-phase10-standings');
try {
  const input=JSON.parse(fs.readFileSync(0,'utf8'));
  if(!Array.isArray(input.games)||!Array.isArray(input.teams)||!Number.isSafeInteger(input.seed)||input.seed<0)throw Error('Invalid day input');
  const ids=new Set();
  const results=input.games.map(game=>{
    if(!game||game.status!=='scheduled'||game.id==null||ids.has(String(game.id)))throw Error('Invalid or duplicate scheduled game');
    ids.add(String(game.id));
    return simulateGameScore({gameId:game.id,homeTeamId:game.home,awayTeamId:game.away,seed:input.seed});
  });
  const finals=input.priorFinals.concat(results.map(r=>({id:r.gameId,status:r.status,homeTeamId:r.homeTeamId,awayTeamId:r.awayTeamId,homeGoals:r.homeGoals,awayGoals:r.awayGoals,overtime:r.overtime})));
  const standings=calculateStandings(input.teams,finals);
  process.stdout.write(JSON.stringify({results,standings}));
} catch(error) {
  process.stderr.write(String(error.message||error));
  process.exitCode=1;
}
