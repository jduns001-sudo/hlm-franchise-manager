'use strict';
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateRosterDayWithGoalStats}=require('./hlm-phase10-roster-day-with-stats');
const {calculateStandings}=require('./hlm-phase10-standings');
const {seedPlayoffs}=require('./hlm-phase10-playoffs');
const {createPlayoffBracket}=require('./hlm-phase10-playoff-bracket');
const {simulateExperimentalRosterPlayoffGame}=require('./hlm-phase10-roster-playoff-game');
const KEY='hlm-phase10-roster-experimental-v1';
/** Isolated browser franchise transaction: regular season, stats, and playoffs. */
function createRosterLabSeasonStore(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw new TypeError('Storage API required');
 const store=createFranchiseSaveStore({read:key=>storage.getItem(key),write:(key,value)=>storage.setItem(key,value)},KEY);
 function advanceAndSave(seed=1){
  const state=store.load();if(!state)throw new Error('Create a roster season first');
  if(state.extensions.phase10Playoffs)throw new Error('Playoffs already started');
  if(!state.activity.games.some(g=>g.status==='scheduled'))throw new Error('Regular season complete');
  const result=simulateRosterDayWithGoalStats(state,seed,{experimental:true});
  if(result.advanced)store.save(result.nextState);
  return {...result,saved:result.advanced};
 }
 function startPlayoffsAndSave(){
  const state=store.load();if(!state)throw new Error('Create a roster season first');
  if(state.activity.games.some(g=>g.status!=='final'))throw new Error('Finish all scheduled games before playoffs');
  if(state.extensions.phase10Playoffs)throw new Error('Playoffs already started');
  const standings=calculateStandings(state.universe.teams,state.activity.games);
  const seeds=seedPlayoffs(standings,4);
  const nextState=JSON.parse(JSON.stringify(state));
  nextState.extensions.phase10Playoffs=createPlayoffBracket(seeds,7);
  store.save(nextState);
  return nextState.extensions.phase10Playoffs;
 }
 function playoffGameAndSave(seed=1){
  const state=store.load();if(!state)throw new Error('Create a roster season first');
  const result=simulateExperimentalRosterPlayoffGame(state,seed);
  if(result.advanced)store.save(result.nextState);
  return {...result,saved:result.advanced};
 }
 function exportBackup(){
  const state=store.load();if(!state)throw new Error('No roster lab save to export');
  return JSON.stringify({format:'hlm-phase10-roster-lab-backup-v1',state});
 }
 function importBackup(serialized,{replace=false}={}){
  if(typeof serialized!=='string'||serialized.length>10_000_000)throw new TypeError('Invalid roster lab backup size or type');
  let backup;try{backup=JSON.parse(serialized)}catch(e){throw new Error('Backup is not valid JSON')}
  if(!backup||backup.format!=='hlm-phase10-roster-lab-backup-v1'||!backup.state||!validateGameStateEnvelope(backup.state).valid)
   throw new Error('Invalid roster lab backup format or state');
  if(backup.state.meta.saveId!=='phase10-roster-lab')throw new Error('Backup belongs to a different franchise save');
  if(store.load()&&!replace)throw new Error('Existing roster lab save requires explicit replace');
  store.save(backup.state);return backup.state;
 }
 return {load:store.load,save:store.save,advanceAndSave,startPlayoffsAndSave,playoffGameAndSave,exportBackup,importBackup,key:KEY};
}
module.exports={createRosterLabSeasonStore};
