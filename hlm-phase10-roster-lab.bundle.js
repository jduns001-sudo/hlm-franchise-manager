/* Generated roster lab browser bundle */
(function(global){'use strict';const modules={
"hlm-phase10-roster-lab-entry.js":function(module,exports,require){
'use strict';
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createRosterLabSeasonStore}=require('./hlm-phase10-roster-lab-season-store');
const {calculateStandings}=require('./hlm-phase10-standings');
const {addCalendarDays}=require('./hlm-master-calendar');
function createRosterLabFranchise(){
 const teams=[{id:1,name:'Northport Wolves'},{id:2,name:'Lakeside Falcons'},{id:3,name:'Summit Bears'},{id:4,name:'Riverton Blades'}];
 const positions=['C','LW','RW','D','D','G'];
 const players=teams.flatMap(t=>positions.map((position,i)=>({id:t.id*100+i,name:t.name.split(' ')[0]+' '+position+' '+(i+1),teamId:t.id,position,ovr:72+t.id*3+i})));
 const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
 const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
 const games=[];
 const start='2026-10-13';
 for(let day=1;day<=28;day++){
  const date=addCalendarDays(start,day);
  const pairs=day%2?[[1,2],[3,4]]:[[1,3],[2,4]];
  for(const [homeTeamId,awayTeamId] of pairs)games.push({id:'G'+day+'-'+homeTeamId,date,status:'scheduled',homeTeamId,awayTeamId});
 }
 return createGameStateEnvelope({meta:{saveId:'phase10-roster-lab',controlledTeamId:1,currentDate:start},teams,players,contracts,injuries,games});
}
function createRosterBrowserStore(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw new TypeError('Storage API required');
 return createRosterLabSeasonStore(storage);
}
module.exports={createRosterLabFranchise,createRosterBrowserStore,calculateStandings,addCalendarDays};

},
"hlm-game-state.js":function(module,exports,require){
'use strict';

/**
 * Phase 2 Mission 1: standalone central GameState envelope.
 * No browser storage, UI integration, simulation, or gameplay mutation.
 */

const GAME_STATE_SCHEMA_VERSION = 1;

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function createGameStateEnvelope(input = {}) {
  const meta = input.meta || {};
  return {
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    meta: {
      saveId: meta.saveId || null,
      createdAt: meta.createdAt || null,
      updatedAt: meta.updatedAt || null,
      controlledTeamId: meta.controlledTeamId ?? null,
      currentDate: meta.currentDate || null
    },
    universe: {
      players: clone(input.players || []),
      teams: clone(input.teams || []),
      leagues: clone(input.leagues || []),
      prospects: clone(input.prospects || []),
      staff: clone(input.staff || [])
    },
    assets: {
      contracts: clone(input.contracts || []),
      draftPicks: clone(input.draftPicks || [])
    },
    activity: {
      transactions: clone(input.transactions || []),
      games: clone(input.games || []),
      injuries: clone(input.injuries || [])
    },
    history: {
      seasons: clone(input.seasons || []),
      statistics: clone(input.statistics || []),
      records: clone(input.history || [])
    },
    finances: clone(input.finances || {}),
    extensions: clone(input.extensions || {})
  };
}

function validateGameStateEnvelope(state) {
  const errors = [];
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return { valid: false, errors: [{ code: 'STATE_NOT_OBJECT' }] };
  }
  if (state.schemaVersion !== GAME_STATE_SCHEMA_VERSION) {
    errors.push({ code: 'UNSUPPORTED_SCHEMA_VERSION', value: state.schemaVersion });
  }
  for (const key of ['meta', 'universe', 'assets', 'activity', 'history', 'finances', 'extensions']) {
    if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) {
      errors.push({ code: 'MISSING_STATE_SECTION', section: key });
    }
  }
  const arrays = [
    ['universe', 'players'], ['universe', 'teams'], ['universe', 'leagues'],
    ['universe', 'prospects'], ['universe', 'staff'],
    ['assets', 'contracts'], ['assets', 'draftPicks'],
    ['activity', 'transactions'], ['activity', 'games'], ['activity', 'injuries'],
    ['history', 'seasons'], ['history', 'statistics'], ['history', 'records']
  ];
  for (const [section, field] of arrays) {
    if (state[section] && !Array.isArray(state[section][field])) {
      errors.push({ code: 'STATE_FIELD_NOT_ARRAY', section, field });
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  GAME_STATE_SCHEMA_VERSION,
  createGameStateEnvelope,
  validateGameStateEnvelope
};

},
"hlm-phase10-roster-lab-season-store.js":function(module,exports,require){
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

},
"hlm-phase10-save-store.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateNextDay}=require('./hlm-phase10-simulate-day');

/**
 * Adapter-based save transaction. The adapter must implement read(key)
 * and write(key, serializedState). No implicit browser storage dependency.
 */
function createFranchiseSaveStore(adapter, key='hlm-phase10-save') {
  if (!adapter || typeof adapter.read!=='function' || typeof adapter.write!=='function') {
    throw new TypeError('Save adapter requires read and write methods');
  }
  function load() {
    const raw=adapter.read(key);
    if (raw==null) return null;
    const state=JSON.parse(raw);
    const result=validateGameStateEnvelope(state);
    if (!result.valid) throw new Error('Stored franchise state is invalid');
    return state;
  }
  function save(state) {
    const validation=validateGameStateEnvelope(state);
    if (!validation.valid) throw new Error('Cannot save invalid franchise state');
    const serialized=JSON.stringify(state);
    adapter.write(key,serialized);
    return state;
  }
  function advanceAndSave(seed=0) {
    const current=load();
    if (!current) throw new Error('No saved franchise state');
    const advanced=simulateNextDay(current,seed);
    save(advanced.nextState);
    return advanced;
  }
  return {load,save,advanceAndSave};
}
module.exports={createFranchiseSaveStore};

},
"hlm-phase10-simulate-day.js":function(module,exports,require){
'use strict';
const {prepareDayAdvance}=require('./hlm-phase10-day-advance');
const {applyScheduledGame}=require('./hlm-phase10-apply-game');
const {calculateStandings}=require('./hlm-phase10-standings');

/**
 * Pure one-day simulation transaction. Returns a candidate state and standings;
 * persistence is deliberately delegated to the caller.
 */
function simulateNextDay(state, seed=0, options={}) {
  if (!Number.isSafeInteger(seed) || seed<0) throw new TypeError('Seed must be a nonnegative safe integer');
  const day=prepareDayAdvance(state);
  let nextState=day.nextState;
  const results=[];
  const games=nextState.activity.games.filter(game=>game && game.status==='scheduled' && game.date===day.toDate);
  const ids=new Set();
  for (const game of games) {
    if (game.id==null || ids.has(String(game.id))) throw new Error('Duplicate or missing scheduled game id');
    ids.add(String(game.id));
  }
  for (const game of games) {
    const applied=applyScheduledGame(nextState,game.id,seed,options);
    nextState=applied.nextState;
    results.push(applied.result);
  }
  const standings=calculateStandings(nextState.universe.teams,nextState.activity.games);
  return {fromDate:day.fromDate,toDate:day.toDate,nextState,results,standings};
}
module.exports={simulateNextDay};

},
"hlm-phase10-day-advance.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope} = require('./hlm-game-state');
const {addCalendarDays,assertIsoDate} = require('./hlm-master-calendar');

/**
 * Pure calendar advance candidate. Does not simulate games or persist state.
 * Callers must commit the returned state through the approved save pathway.
 */
function prepareDayAdvance(state) {
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Invalid game state');
    error.code = 'INVALID_GAME_STATE';
    error.details = validation.errors;
    throw error;
  }
  assertIsoDate(state.meta.currentDate);
  const fromDate = state.meta.currentDate;
  const toDate = addCalendarDays(fromDate, 1);
  const nextState = JSON.parse(JSON.stringify(state));
  nextState.meta.currentDate = toDate;
  const scheduledToday = nextState.activity.games.filter(game =>
    game && game.status === 'scheduled' && game.date === toDate
  ).map(game => game.id ?? null);
  return {
    fromDate,
    toDate,
    scheduledGameIds: scheduledToday,
    nextState
  };
}
module.exports = {prepareDayAdvance};

},
"hlm-master-calendar.js":function(module,exports,require){
'use strict';

/**
 * Phase 3 Mission 88: deterministic master-calendar foundation.
 * Pure date logic only. No schedules, games, standings, phase transitions,
 * persistence writes, or Front Office wiring.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    const error = new Error('Calendar date must use YYYY-MM-DD.');
    error.code = 'INVALID_CALENDAR_DATE';
    throw error;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    const error = new Error('Calendar date is not a real Gregorian date.');
    error.code = 'INVALID_CALENDAR_DATE';
    throw error;
  }
  return value;
}

function addCalendarDays(dateText, days) {
  assertIsoDate(dateText);
  if (!Number.isSafeInteger(days)) {
    const error = new Error('Calendar day advancement must be a safe integer.');
    error.code = 'INVALID_CALENDAR_ADVANCE';
    throw error;
  }
  const [year, month, day] = dateText.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function createMasterCalendar(input = {}) {
  const currentDate = assertIsoDate(input.currentDate);
  return Object.freeze({
    kind: 'master-hockey-calendar',
    version: 1,
    currentDate,
    advanceDays(days = 1) {
      if (!Number.isSafeInteger(days) || days < 1) {
        const error = new Error('Calendar must advance by at least one whole day.');
        error.code = 'INVALID_CALENDAR_ADVANCE';
        throw error;
      }
      return createMasterCalendar({ currentDate: addCalendarDays(currentDate, days) });
    }
  });
}

module.exports = { assertIsoDate, addCalendarDays, createMasterCalendar };

},
"hlm-phase10-apply-game.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');

/**
 * Apply one deterministic game result to a cloned save.
 * The caller owns persistence and standings projection.
 */
function applyScheduledGame(state, gameId, seed, options={}) {
  const validation=validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error=new Error('Invalid game state');
    error.code='INVALID_GAME_STATE';
    throw error;
  }
  if (gameId == null) throw new TypeError('Game id required');
  const nextState=JSON.parse(JSON.stringify(state));
  const matches=nextState.activity.games.filter(game=>game && String(game.id)===String(gameId));
  if (matches.length!==1) throw new Error('Scheduled game must exist exactly once');
  const game=matches[0];
  if (game.status!=='scheduled') throw new Error('Game already played or not scheduled');
  if (!nextState.universe.teams.some(team=>team && String(team.id)===String(game.homeTeamId)) ||
      !nextState.universe.teams.some(team=>team && String(team.id)===String(game.awayTeamId))) {
    throw new Error('Game references unknown team');
  }
  const input={gameId:game.id,homeTeamId:game.homeTeamId,awayTeamId:game.awayTeamId,seed};
  if(options.experimentalRosterAware===true){
    const plan=nextState.extensions?.phase11GmGoaliePlan;
    if(!plan||String(plan.teamId)!==String(nextState.meta.controlledTeamId))throw Error('Explicit GM goalie approval required for experimental roster-aware simulation');
    const side=String(plan.teamId)===String(game.homeTeamId)?'home':String(plan.teamId)===String(game.awayTeamId)?'away':null;
    if(side){
      const goalie=nextState.universe.players.filter(p=>String(p.id)===String(plan.playerId)&&String(p.teamId)===String(plan.teamId)&&p.position==='G');
      if(goalie.length!==1)throw Error('Approved goalie is not eligible');
      if((nextState.activity.injuries||[]).some(i=>String(i.playerId)===String(plan.playerId)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false))throw Error('Approved goalie is injured');
      const rating=goalie[0].overall??goalie[0].ovr;
      if(!Number.isSafeInteger(rating)||rating<1||rating>99)throw Error('Rated goalie required for experimental roster-aware simulation');
      input.experimentalApprovedGoalieOverall=rating;
      input.experimentalApprovedGoalieSide=side;
      const approved=nextState.extensions?.phase11GmApprovedSkaters;
      if(!approved)throw Error('Explicit GM-approved skater participation required for experimental roster-aware simulation');
      const eligible=require('./hlm-phase11-unified-box-scores').eligibleExperimentalSkaters(nextState,plan.teamId);
      input.experimentalVerifiedSkaterAverage=Math.round(eligible.reduce((total,p)=>total+(p.overall??p.ovr),0)/eligible.length);
      input.experimentalVerifiedSkaterSide=side;
      const opponentTeamId=side==='home'?game.awayTeamId:game.homeTeamId;
      const opponentSkaters=nextState.universe.players.filter(p=>String(p.teamId)===String(opponentTeamId)&&['C','LW','RW','D','F'].includes(String(p.position||'').toUpperCase())&&Number.isSafeInteger(p.overall??p.ovr)&&(p.overall??p.ovr)>=1&&(p.overall??p.ovr)<=99&&!(nextState.activity.injuries||[]).some(i=>String(i.playerId)===String(p.id)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false));
      if(opponentSkaters.length>=3){
        input.experimentalOpponentVerifiedSkaterAverage=Math.round(opponentSkaters.reduce((total,p)=>total+(p.overall??p.ovr),0)/opponentSkaters.length);
        input.experimentalOpponentVerifiedSkaterSide=side==='home'?'away':'home';
      }
    }
  }
  const result=simulateGameScore(input);
  Object.assign(game,result);
  return {nextState,result};
}
module.exports={applyScheduledGame};

},
"hlm-phase10-game-simulator.js":function(module,exports,require){
'use strict';

/**
 * Deterministic prototype score simulator. Not a player-stat or standings engine.
 * Same matchup and seed always produce the same result.
 */
function simulateGameScore(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Game input must be an object');
  const {gameId, homeTeamId, awayTeamId, seed} = input;
  const rating=input.experimentalApprovedGoalieOverall;
  const skaterAverage=input.experimentalVerifiedSkaterAverage;
  const opponentSkaterAverage=input.experimentalOpponentVerifiedSkaterAverage;
  if(skaterAverage!==undefined&&(!Number.isSafeInteger(skaterAverage)||skaterAverage<1||skaterAverage>99||!['home','away'].includes(input.experimentalVerifiedSkaterSide)||rating===undefined))throw Error('Invalid experimental verified skater average or side');
  if(opponentSkaterAverage!==undefined&&(!Number.isSafeInteger(opponentSkaterAverage)||opponentSkaterAverage<1||opponentSkaterAverage>99||!['home','away'].includes(input.experimentalOpponentVerifiedSkaterSide)||input.experimentalOpponentVerifiedSkaterSide===input.experimentalVerifiedSkaterSide||rating===undefined))throw Error('Invalid experimental opponent skater average or side');
  if(rating!==undefined&&(!Number.isSafeInteger(rating)||rating<1||rating>99||!['home','away'].includes(input.experimentalApprovedGoalieSide)))throw Error('Invalid experimental approved goalie rating or side');
  if (gameId == null || homeTeamId == null || awayTeamId == null ||
      String(homeTeamId) === String(awayTeamId) ||
      !Number.isSafeInteger(seed) || seed < 0) {
    const error = new Error('Invalid game simulation input');
    error.code = 'INVALID_GAME_INPUT';
    throw error;
  }
  let state = seed >>> 0;
  const mix = String(gameId) + '|' + String(homeTeamId) + '|' + String(awayTeamId);
  for (let i = 0; i < mix.length; i++) state = (Math.imul(state ^ mix.charCodeAt(i), 16777619)) >>> 0;
  const next = () => {state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296;};
  const homeGoals = Math.floor(next() * 6);
  const awayGoals = Math.floor(next() * 6);
  const overtime = homeGoals === awayGoals;
  const finalHome = homeGoals + (overtime && next() >= 0.5 ? 1 : 0);
  const finalAway = awayGoals + (overtime && finalHome === homeGoals ? 1 : 0);
  // Experimental, opt-in-only bounded goalie effect; legacy deterministic results remain unchanged.
  let adjustedAway=finalAway,adjustedHome=finalHome;
  if(rating!==undefined){
    const shift=rating>=85?-1:rating<=65?1:0;
    if(input.experimentalApprovedGoalieSide==='home')adjustedAway=Math.max(0,finalAway+shift);
    else adjustedHome=Math.max(0,finalHome+shift);
  }
  if(skaterAverage!==undefined){
    // One bounded team-level scoring effect from healthy, rated roster skaters; no invented player statistics.
    const shift=skaterAverage>=85?1:skaterAverage<=65?-1:0;
    if(input.experimentalVerifiedSkaterSide==='home')adjustedHome=Math.max(0,adjustedHome+shift);
    else adjustedAway=Math.max(0,adjustedAway+shift);
  }
  if(opponentSkaterAverage!==undefined){
    const shift=opponentSkaterAverage>=85?1:opponentSkaterAverage<=65?-1:0;
    if(input.experimentalOpponentVerifiedSkaterSide==='home')adjustedHome=Math.max(0,adjustedHome+shift);
    else adjustedAway=Math.max(0,adjustedAway+shift);
  }
  const experimentalOvertime=rating!==undefined&&adjustedHome===adjustedAway;
  if(experimentalOvertime){
    // A rating-created tie is resolved in overtime, never misreported as a regulation win.
    if((seed+String(gameId).length)%2===0)adjustedHome++;
    else adjustedAway++;
  }
  return Object.freeze({
    gameId, homeTeamId, awayTeamId,
    homeGoals: adjustedHome, awayGoals: adjustedAway,
    overtime: overtime||experimentalOvertime, winnerTeamId: adjustedHome > adjustedAway ? homeTeamId : awayTeamId,
    ...(rating===undefined?{}:{experimentalRosterAware:true,official:false}),
    status: 'final'
  });
}
if (typeof module === 'object' && module.exports) module.exports = {simulateGameScore};
if (typeof window !== 'undefined') window.HLMPhase10GameSimulator = Object.freeze({simulateGameScore});

},
"hlm-phase10-standings.js":function(module,exports,require){
'use strict';

/**
 * Pure standings projection from final game records.
 * Regulation win = 2 points, overtime win = 2, overtime loss = 1.
 * No persistent mutations or schedule changes.
 */
function calculateStandings(teams, games) {
  if (!Array.isArray(teams) || !Array.isArray(games)) throw new TypeError('Teams and games must be arrays');
  const standings = new Map();
  for (const team of teams) {
    if (!team || team.id == null) throw new TypeError('Team requires id');
    const id = String(team.id);
    if (standings.has(id)) throw new Error('Duplicate team id: ' + id);
    standings.set(id, {teamId:team.id, teamName:team.name || null, gp:0, w:0, l:0, otl:0, gf:0, ga:0, points:0});
  }
  const seen = new Set();
  for (const game of games) {
    if (!game || game.status !== 'final') continue;
    if (game.id == null) throw new Error('Final game requires id');
    const gameId=String(game.id);
    if (seen.has(gameId)) throw new Error('Duplicate final game: ' + gameId);
    seen.add(gameId);
    const home=standings.get(String(game.homeTeamId));
    const away=standings.get(String(game.awayTeamId));
    if (!home || !away || home===away) throw new Error('Final game has invalid teams: ' + gameId);
    const hg=game.homeGoals, ag=game.awayGoals;
    if (!Number.isSafeInteger(hg) || !Number.isSafeInteger(ag) || hg<0 || ag<0 || hg===ag) {
      throw new Error('Final game requires non-tied nonnegative integer scores: ' + gameId);
    }
    if (game.overtime != null && typeof game.overtime !== 'boolean') throw new Error('Invalid overtime flag: ' + gameId);
    const winner=hg>ag?home:away;
    const loser=hg>ag?away:home;
    home.gp++;away.gp++;
    home.gf+=hg;home.ga+=ag;away.gf+=ag;away.ga+=hg;
    winner.w++;winner.points+=2;
    if (game.overtime) {loser.otl++;loser.points++;}
    else loser.l++;
  }
  return [...standings.values()].sort((a,b)=>b.points-a.points || b.w-a.w || (b.gf-b.ga)-(a.gf-a.ga) || String(a.teamId).localeCompare(String(b.teamId)));
}
module.exports={calculateStandings};

},
"hlm-phase10-roster-day-with-stats.js":function(module,exports,require){
'use strict';
const {simulateControlledRosterDay}=require('./hlm-phase10-controlled-roster-day');
const {buildExperimentalGoalEvents,aggregateExperimentalGoals}=require('./hlm-phase10-experimental-player-goals');
const {buildUnifiedBoxScores,aggregateUnifiedBoxScores}=require('./hlm-phase11-unified-box-scores');
/** Atomic day simulation with synthetic player goals, persisted only by caller. */
function simulateRosterDayWithGoalStats(state,seed=1,options={}){
 const result=simulateControlledRosterDay(state,seed,options);
 if(!result.advanced)return {...result,goalEvents:[],goalLeaders:[]};
 const nextState=result.nextState;
 const existing=Array.isArray(nextState.extensions.phase10ExperimentalGoalEvents)?
  nextState.extensions.phase10ExperimentalGoalEvents:[];
 const newEvents=result.results.flatMap(game=>buildExperimentalGoalEvents(nextState,game,seed));
 const keys=new Set(existing.map(e=>String(e.gameId)+':'+String(e.teamId)+':'+String(e.sequence)));
 for(const event of newEvents){
  const key=String(event.gameId)+':'+String(event.teamId)+':'+String(event.sequence);
  if(keys.has(key))throw new Error('Duplicate experimental goal event '+key);
  keys.add(key);
 }
 const goalEvents=existing.concat(newEvents);
 nextState.extensions.phase10ExperimentalGoalEvents=goalEvents;
 const goalLeaders=aggregateExperimentalGoals(goalEvents);
 const boxScores=buildUnifiedBoxScores(nextState,result.results,newEvents,seed);
 const prior=Array.isArray(nextState.extensions.phase11ExperimentalBoxScores)?nextState.extensions.phase11ExperimentalBoxScores:[];
 nextState.extensions.phase11ExperimentalBoxScores=prior.concat(boxScores);
 nextState.extensions.phase11ExperimentalStatHistory=aggregateUnifiedBoxScores(nextState.extensions.phase11ExperimentalBoxScores);
 nextState.extensions.phase10ExperimentalGoalLeaders=goalLeaders;
 return {...result,goalEvents:newEvents,goalLeaders,boxScores,statHistory:nextState.extensions.phase11ExperimentalStatHistory};
}
module.exports={simulateRosterDayWithGoalStats};

},
"hlm-phase10-controlled-roster-day.js":function(module,exports,require){
'use strict';
const {prepareDayAdvance}=require('./hlm-phase10-day-advance');
const {executeControlledRosterGame}=require('./hlm-phase10-controlled-roster-game');
const {calculateStandings}=require('./hlm-phase10-standings');

/** Experimental roster-backed daily tick. Atomic: blocked games never advance date. */
function simulateControlledRosterDay(state,seed=1,options={}) {
 if (!options || options.experimental!==true || options.persist===true) {
  const error=new Error('Experimental nonpersistent mode required');
  error.code='CONTROLLED_ROSTER_DAY_NOT_ENABLED';throw error;
 }
 if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Invalid day seed');
 const day=prepareDayAdvance(state);
 const games=day.nextState.activity.games.filter(g=>g.status==='scheduled'&&g.date===day.toDate);
 const ids=games.map(g=>String(g.id));
 if(ids.some(id=>id==='undefined')||new Set(ids).size!==ids.length){
  const error=new Error('Duplicate or missing game ID');
  error.code='INVALID_ROSTER_DAY_SCHEDULE';throw error;
 }
 let candidate=day.nextState;
 const results=[];
 const blocked=[];
 for(const game of games){
  const outcome=executeControlledRosterGame(candidate,game.id,seed,{experimental:true});
  if(!outcome.applied){
   blocked.push({gameId:game.id,blockers:outcome.blockers});
  }else{
   candidate=outcome.nextState;
   results.push(outcome.game);
  }
 }
 if(blocked.length)return {advanced:false,blocked,results:[],nextState:null,
  fromDate:day.fromDate,toDate:day.toDate,official:false,persistencePerformed:false};
 const standings=calculateStandings(candidate.universe.teams,candidate.activity.games);
 return {advanced:true,blocked:[],results,nextState:candidate,standings,
  fromDate:day.fromDate,toDate:day.toDate,official:false,persistencePerformed:false};
}
module.exports={simulateControlledRosterDay};

},
"hlm-phase10-controlled-roster-game.js":function(module,exports,require){
'use strict';
/**
 * Mission 742: one-step roster-driven game execution for explicit sandbox use.
 * NOT official league certification, player statistics, or disk persistence.
 * The caller must opt into experimental simulation. No caller-provided
 * authorization token is accepted or issued.
 */
const { validateGameStateEnvelope } = require('./hlm-game-state');
const { simulateRosterWeightedExhibition } = require('./hlm-phase10-roster-weighted-exhibition');
const { calculateStandings } = require('./hlm-phase10-standings');

function executeControlledRosterGame(state, gameId, seed = 1, options = {}) {
  if (!options || options.experimental !== true || options.persist === true) {
    const error = new Error('Explicit nonpersistent experimental mode required');
    error.code = 'CONTROLLED_ROSTER_GAME_NOT_ENABLED';
    throw error;
  }
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Invalid GameState');
    error.code = 'INVALID_FRANCHISE_BRIDGE_STATE';
    throw error;
  }
  const matches = state.activity.games.filter(game => String(game.id) === String(gameId));
  if (matches.length !== 1 || matches[0].status !== 'scheduled') {
    const error = new Error('One unplayed scheduled game required');
    error.code = 'INVALID_CONTROLLED_ROSTER_GAME';
    throw error;
  }
  const scheduled = matches[0];
  const exhibition = simulateRosterWeightedExhibition(
    state, scheduled.homeTeamId, scheduled.awayTeamId, seed
  );
  if (!exhibition.playable) return {
    applied:false, blockers:exhibition.blockers.slice(), nextState:null,
    exhibition, official:false, persistencePerformed:false, sourceStateMutated:false
  };
  const nextState = JSON.parse(JSON.stringify(state));
  const game = nextState.activity.games.find(g => String(g.id) === String(gameId));
  Object.assign(game, {
    status:'final', homeGoals:exhibition.score.homeGoals,
    awayGoals:exhibition.score.awayGoals, overtime:exhibition.score.overtime,
    winnerTeamId:exhibition.score.winnerTeamId,
    simulationMode:'experimental-roster-weighted', official:false
  });
  const standings = calculateStandings(nextState.universe.teams, nextState.activity.games);
  nextState.extensions.phase10ExperimentalStandings = standings;
  return {
    applied:true, blockers:[], nextState, game:{...game}, standings,
    exhibition, official:false, persistencePerformed:false, sourceStateMutated:false
  };
}
module.exports = { executeControlledRosterGame };

},
"hlm-phase10-roster-weighted-exhibition.js":function(module,exports,require){
'use strict';
/** Deterministic roster-weighted exhibition result. Never an official game. */
const { createRosterBackedMatchupPreview } = require('./hlm-phase10-roster-matchup-preview');

function simulateRosterWeightedExhibition(state, homeTeamId, awayTeamId, seed = 1) {
  if (!Number.isSafeInteger(seed) || seed < 0) {
    const error = new TypeError('A nonnegative integer seed is required');
    error.code = 'INVALID_ROSTER_EXHIBITION_SEED';
    throw error;
  }
  const matchup = createRosterBackedMatchupPreview(state, homeTeamId, awayTeamId);
  const teams = [matchup.home, matchup.away];
  const blockers = teams.flatMap(team => [
    ...team.missingSlots.map(position => team.teamId + ':MISSING_' + position),
    ...team.slotEvidence.flatMap(slot => slot.blockers.map(reason => team.teamId + ':' + reason))
  ]);
  if (blockers.length) return {
    kind: 'phase10-roster-weighted-exhibition', version: 1,
    homeTeamId, awayTeamId, seed, playable: false, blockers,
    score: null, official: false, simulationAuthorized: false,
    sourceStateMutated: false, persistencePerformed: false
  };
  const average = team => team.proposedRatingSum / team.proposedRatingCount;
  let rng = (seed ^ Math.imul(homeTeamId, 2654435761) ^ Math.imul(awayTeamId, 1597334677)) >>> 0;
  const next = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  const homeStrength = average(matchup.home);
  const awayStrength = average(matchup.away);
  const delta = Math.max(-3, Math.min(3, (homeStrength - awayStrength) / 12));
  const homeRegulation = Math.max(0, Math.min(9, Math.round(2.8 + delta / 2 + (next() - 0.5) * 3)));
  const awayRegulation = Math.max(0, Math.min(9, Math.round(2.8 - delta / 2 + (next() - 0.5) * 3)));
  const overtime = homeRegulation === awayRegulation;
  const homeWinsOvertime = overtime && next() < Math.max(0.15, Math.min(0.85, 0.5 + delta / 10));
  const homeGoals = homeRegulation + (homeWinsOvertime ? 1 : 0);
  const awayGoals = awayRegulation + (overtime && !homeWinsOvertime ? 1 : 0);
  return {
    kind: 'phase10-roster-weighted-exhibition', version: 1,
    homeTeamId, awayTeamId, seed, playable: true, blockers: [],
    rosterRating: { home: homeStrength, away: awayStrength },
    score: { homeGoals, awayGoals, overtime,
      winnerTeamId: homeGoals > awayGoals ? homeTeamId : awayTeamId },
    official: false, simulationAuthorized: false,
    sourceStateMutated: false, persistencePerformed: false
  };
}
module.exports = { simulateRosterWeightedExhibition };

},
"hlm-phase10-roster-matchup-preview.js":function(module,exports,require){
'use strict';

/**
 * Mission 737: read-only roster-backed game matchup preview.
 * Never computes a score or authorizes simulation from eligibility evidence.
 */
const { createSimulationLineupProposals } = require('./hlm-phase10-lineup-proposals');
const { createGameEligibilityEvidence } = require('./hlm-phase10-game-eligibility-evidence');

function createRosterBackedMatchupPreview(state, homeTeamId, awayTeamId) {
  if (!Number.isSafeInteger(homeTeamId) || homeTeamId <= 0 ||
      !Number.isSafeInteger(awayTeamId) || awayTeamId <= 0 || homeTeamId === awayTeamId) {
    const error = new TypeError('Two distinct positive team IDs are required');
    error.code = 'INVALID_PHASE10_MATCHUP_TEAM_IDS';
    throw error;
  }
  const proposals = createSimulationLineupProposals(state);
  const evidence = createGameEligibilityEvidence(state);
  const summarize = teamId => {
    const team = proposals.teams.find(item => item.teamId === teamId);
    const proof = evidence.teams.find(item => item.teamId === teamId);
    if (!team || !proof) {
      const error = new Error('Matchup team ID is not in the canonical franchise teams');
      error.code = 'UNKNOWN_PHASE10_MATCHUP_TEAM_ID';
      throw error;
    }
    const selected = [...team.skaterSlots, team.goalieSlot];
    const ratings = selected.filter(slot => slot.playerId !== null && Number.isInteger(slot.overall))
      .map(slot => slot.overall);
    return {
      teamId,
      teamName: team.teamName,
      proposedPlayerIds: selected.filter(slot => slot.playerId !== null).map(slot => slot.playerId),
      missingSlots: team.missingSlots.slice(),
      proposedRatingSum: ratings.reduce((sum, value) => sum + value, 0),
      proposedRatingCount: ratings.length,
      evidenceCompleteCount: proof.evidenceCompleteCount,
      blockedOrUnverifiedCount: proof.blockedOrUnverifiedCount,
      slotEvidence: proof.slots.map(slot => ({
        position: slot.position, playerId: slot.playerId, status: slot.status,
        blockers: slot.blockers.slice()
      })),
      gameEligible: null
    };
  };
  return {
    kind: 'phase10-roster-backed-matchup-preview',
    version: 1,
    home: summarize(homeTeamId),
    away: summarize(awayTeamId),
    validation: { ...evidence.validation },
    scorePredicted: false,
    eligibilityCertified: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterBackedMatchupPreview };

},
"hlm-phase10-lineup-proposals.js":function(module,exports,require){
'use strict';

/**
 * Mission 722: deterministic, read-only lineup proposals from Mission 721.
 * Proposed players are not authorized for simulation.
 */
const { assessSimulationLineupCandidates } = require('./hlm-phase10-lineup-candidate-assessment');

const SKATER_SLOTS = ['C', 'LW', 'RW', 'D', 'D'];
const REQUIRED_GOALIES = 1;

function createSimulationLineupProposals(state) {
  const assessment = assessSimulationLineupCandidates(state);
  const teams = assessment.teams.map(team => {
    const candidates = team.candidates.slice().sort((a, b) =>
      b.overall - a.overall || a.playerId - b.playerId
    );
    const selected = new Set();
    const slots = SKATER_SLOTS.map(position => {
      const player = candidates.find(p => p.position === position && !selected.has(p.playerId));
      if (!player) return { position, playerId: null, overall: null };
      selected.add(player.playerId);
      return { position, playerId: player.playerId, overall: player.overall };
    });
    const goalie = candidates.find(p => p.position === 'G');
    if (goalie) selected.add(goalie.playerId);
    const goalieSlot = {
      position: 'G',
      playerId: goalie ? goalie.playerId : null,
      overall: goalie ? goalie.overall : null
    };
    const missingSlots = slots.filter(slot => slot.playerId === null).map(slot => slot.position);
    if (!goalie) missingSlots.push('G');
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      skaterSlots: slots,
      goalieSlot,
      missingSlots,
      benchPlayerIds: candidates.filter(p => !selected.has(p.playerId)).map(p => p.playerId),
      excludedPlayerIds: team.excluded.map(p => p.playerId),
      proposalComplete: missingSlots.length === 0,
      lineupAuthorized: false
    };
  });
  return {
    kind: 'phase10-lineup-proposals',
    version: 1,
    slotDefinition: { skaters: SKATER_SLOTS.slice(), goalies: REQUIRED_GOALIES },
    teams,
    unresolvedPlayers: assessment.unresolvedPlayers.map(p => ({ ...p })),
    diagnostics: assessment.diagnostics.map(d => ({ ...d })),
    validation: { ...assessment.validation },
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createSimulationLineupProposals };

},
"hlm-phase10-lineup-candidate-assessment.js":function(module,exports,require){
'use strict';

/**
 * Mission 721: deterministic, read-only lineup candidate assessment.
 * Conservative checks only; no game/lineup authorization or roster mutation.
 */
const { createSimulationTeamRosterProjection } = require('./hlm-phase10-team-roster-projection');

const POSITIONS = new Set(['C', 'LW', 'RW', 'D', 'G']);

function assessSimulationLineupCandidates(state) {
  const projection = createSimulationTeamRosterProjection(state);
  const teams = projection.teams.map(team => {
    const candidates = [];
    const excluded = [];
    for (const player of team.players) {
      const reasons = [];
      if (player.retired) reasons.push('RETIRED');
      if (!POSITIONS.has(player.position)) reasons.push('POSITION_UNKNOWN');
      if (!Number.isInteger(player.overall) || player.overall < 0 || player.overall > 99) {
        reasons.push('OVERALL_INVALID');
      }
      const item = { playerId: player.playerId, position: player.position,
        overall: player.overall, reasons };
      if (reasons.length) excluded.push(item);
      else candidates.push(item);
    }
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      candidates,
      excluded,
      candidateCount: candidates.length,
      excludedCount: excluded.length,
      // Lineup construction, league roster limits, injuries and contracts not yet resolved.
      lineupReady: null
    };
  });
  return {
    kind: 'phase10-lineup-candidate-assessment',
    version: 1,
    teams,
    unresolvedPlayers: projection.unresolvedPlayers.map(player => ({ ...player })),
    diagnostics: projection.diagnostics.map(diagnostic => ({ ...diagnostic })),
    validation: { ...projection.validation },
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessSimulationLineupCandidates };

},
"hlm-phase10-team-roster-projection.js":function(module,exports,require){
'use strict';

/**
 * Mission 720: read-only team roster projection for Phase 10 integration.
 * Identity association only: not a lineup, roster eligibility or game authorization.
 */
const { createFranchiseSimulationSnapshot } = require('./hlm-franchise-simulation-data-bridge');

function createSimulationTeamRosterProjection(state) {
  const snapshot = createFranchiseSimulationSnapshot(state);
  const byId = new Map(snapshot.players.map(player => [player.id, player]));
  const teams = snapshot.teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    playerIds: team.playerIds.slice(),
    players: team.playerIds.map(id => {
      const player = byId.get(id);
      return {
        playerId: player.id,
        teamId: player.teamId,
        position: player.position,
        overall: player.overall,
        retired: player.retired
      };
    })
  }));
  return {
    kind: 'phase10-team-roster-projection',
    version: 1,
    teams,
    unresolvedPlayers: snapshot.players.filter(p => !p.teamResolved).map(p => ({
      playerId: p.id, teamId: p.teamId
    })),
    diagnostics: snapshot.diagnostics.map(d => ({ ...d })),
    validation: { ...snapshot.validation },
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createSimulationTeamRosterProjection };

},
"hlm-franchise-simulation-data-bridge.js":function(module,exports,require){
'use strict';

/**
 * Mission 662: read-only franchise-to-simulation identity bridge.
 * No persistence, roster eligibility decisions, score calculation, or UI wiring.
 */
const { validateGameStateEnvelope } = require('./hlm-game-state');

function permanentId(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function createFranchiseSimulationSnapshot(state) {
  const envelope = validateGameStateEnvelope(state);
  if (!envelope.valid) {
    const error = new Error('A valid GameState envelope is required');
    error.code = 'INVALID_FRANCHISE_BRIDGE_STATE';
    error.details = envelope.errors;
    throw error;
  }

  const diagnostics = [];
  const teamIds = new Set();
  const playerIds = new Set();
  const teams = [];
  const players = [];
  const playerIdsByTeam = new Map();

  for (const [index, team] of state.universe.teams.entries()) {
    const id = permanentId(team && team.id);
    if (id === null) {
      diagnostics.push({ code: 'INVALID_TEAM_ID', index, value: team && team.id });
      continue;
    }
    if (teamIds.has(id)) {
      diagnostics.push({ code: 'DUPLICATE_TEAM_ID', index, teamId: id });
      continue;
    }
    teamIds.add(id);
    teams.push({ id, name: typeof team.name === 'string' ? team.name : null });
    playerIdsByTeam.set(id, []);
  }

  for (const [index, player] of state.universe.players.entries()) {
    const id = permanentId(player && player.id);
    if (id === null) {
      diagnostics.push({ code: 'INVALID_PLAYER_ID', index, value: player && player.id });
      continue;
    }
    if (playerIds.has(id)) {
      diagnostics.push({ code: 'DUPLICATE_PLAYER_ID', index, playerId: id });
      continue;
    }
    playerIds.add(id);

    // Preserve unresolved/sentinel assignments exactly. Never infer free agency.
    const teamId = player.teamId === undefined ? null : player.teamId;
    const teamResolved = permanentId(teamId) !== null && teamIds.has(teamId);
    if (!teamResolved) {
      diagnostics.push({ code: 'UNRESOLVED_PLAYER_TEAM_REFERENCE', playerId: id, teamId });
    } else {
      playerIdsByTeam.get(teamId).push(id);
    }
    players.push({
      id,
      teamId,
      teamResolved,
      retired: player.retired === true,
      position: player.position ?? null,
      overall: player.ovr ?? null
    });
  }

  const teamSnapshots = teams.map(team => ({
    ...team,
    playerIds: playerIdsByTeam.get(team.id).slice()
  }));
  return {
    kind: 'franchise-simulation-data-snapshot',
    version: 1,
    teams: teamSnapshots,
    players,
    diagnostics,
    validation: { valid: diagnostics.length === 0, issueCount: diagnostics.length },
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createFranchiseSimulationSnapshot };

},
"hlm-phase10-game-eligibility-evidence.js":function(module,exports,require){
'use strict';

/**
 * Mission 736: join lineup proposals with contract/injury evidence for games.
 * A proposal is never authorization. Unknown or absent evidence stays unverified.
 */
const { createSimulationLineupProposals } = require('./hlm-phase10-lineup-proposals');
const { assessPlayerContractInjuryEvidence } = require('./hlm-phase10-contract-injury-evidence');

function createGameEligibilityEvidence(state) {
  const proposals = createSimulationLineupProposals(state);
  const evidence = assessPlayerContractInjuryEvidence(state);
  const byTeam = new Map(evidence.teams.map(team => [team.teamId,
    new Map(team.players.map(player => [player.playerId, player]))]));
  const teams = proposals.teams.map(team => {
    const playerEvidence = byTeam.get(team.teamId);
    const slots = [...team.skaterSlots, team.goalieSlot].map(slot => {
      if (slot.playerId === null) return {
        position: slot.position, playerId: null, status: 'missing',
        blockers: ['MISSING_POSITION']
      };
      const record = playerEvidence && playerEvidence.get(slot.playerId);
      const blockers = record ? record.blockers.slice() : ['MISSING_EVIDENCE'];
      if (record && record.contractEvidence !== 'active-team-contract') {
        blockers.push('CONTRACT_NOT_VERIFIED');
      }
      if (record && record.injuryEvidence !== 'no-active-injury-recorded') {
        blockers.push('INJURY_CLEARANCE_NOT_VERIFIED');
      }
      return {
        position: slot.position, playerId: slot.playerId,
        status: blockers.length ? 'blocked-or-unverified' : 'evidence-complete',
        contractEvidence: record ? record.contractEvidence : 'unverified',
        injuryEvidence: record ? record.injuryEvidence : 'unverified',
        blockers
      };
    });
    return {
      teamId: team.teamId,
      slots,
      missingSlots: team.missingSlots.slice(),
      evidenceCompleteCount: slots.filter(slot => slot.status === 'evidence-complete').length,
      blockedOrUnverifiedCount: slots.filter(slot => slot.status !== 'evidence-complete').length,
      // No proof of medical clearance, roster limits, cap or league rules.
      gameEligible: null
    };
  });
  return {
    kind: 'phase10-game-eligibility-evidence',
    version: 1,
    teams,
    validation: { ...proposals.validation },
    eligibilityCertified: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createGameEligibilityEvidence };

},
"hlm-phase10-contract-injury-evidence.js":function(module,exports,require){
'use strict';

/**
 * Mission 735: read-only contract/injury evidence for roster candidates.
 * Unknown statuses remain unverified. No eligibility or game authorization.
 */
const { assessSimulationLineupCandidates } = require('./hlm-phase10-lineup-candidate-assessment');

function assessPlayerContractInjuryEvidence(state) {
  const lineup = assessSimulationLineupCandidates(state);
  const contracts = state.assets.contracts;
  const injuries = state.activity.injuries;
  const teams = lineup.teams.map(team => ({
    teamId: team.teamId,
    players: [...team.candidates, ...team.excluded].map(player => {
      const matches = contracts.filter(c => c && c.playerId === player.playerId);
      const active = matches.filter(c => c.status === 'Active' || c.status === 'Signed');
      const conflicting = active.length > 1 || (active.length === 1 && active[0].teamId !== team.teamId);
      const contractEvidence = conflicting ? 'conflicting'
        : active.length === 1 ? 'active-team-contract' : 'unverified';
      const injuryMatches = injuries.filter(i => i && i.playerId === player.playerId);
      const activeInjuries = injuryMatches.filter(i => i.status === 'Active');
      const injuryEvidence = activeInjuries.length ? 'active-injury'
        : injuryMatches.some(i => !['Active', 'Recovered'].includes(i.status)) ? 'unverified'
        : injuryMatches.length ? 'no-active-injury-recorded' : 'unverified';
      const blockers = [];
      if (player.reasons.length) blockers.push('BASELINE_CANDIDATE_EXCLUDED');
      if (conflicting) blockers.push('CONTRACT_CONFLICT');
      if (activeInjuries.length) blockers.push('ACTIVE_INJURY');
      return {
        playerId: player.playerId,
        contractEvidence,
        injuryEvidence,
        contractRecordCount: matches.length,
        injuryRecordCount: injuryMatches.length,
        blockers
      };
    })
  }));
  return {
    kind: 'phase10-contract-injury-evidence',
    version: 1,
    teams,
    validation: { ...lineup.validation },
    // No proof of contract or absence of an injury is inferred from missing data.
    eligibilityCertified: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessPlayerContractInjuryEvidence };

},
"hlm-phase10-experimental-player-goals.js":function(module,exports,require){
'use strict';
const {eligibleExperimentalSkaters}=require('./hlm-phase11-unified-box-scores');
/**
 * Deterministic experimental goal attribution for simulated games.
 * Derived synthetic events, never historical NHL player statistics.
 */
function buildExperimentalGoalEvents(state,game,seed=1){
 if(!game||game.status!=='final'||!Number.isSafeInteger(game.homeGoals)||!Number.isSafeInteger(game.awayGoals)||
    game.homeGoals<0||game.awayGoals<0||!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Valid final game and seed required');
 const events=[];
 for(const [teamId,goals] of [[game.homeTeamId,game.homeGoals],[game.awayTeamId,game.awayGoals]]){
  const skaters=eligibleExperimentalSkaters(state,teamId);
  if(!skaters.length&&goals>0)throw new Error('No eligible scoring players for team '+teamId);
  const sorted=skaters.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  for(let i=0;i<goals;i++){
   const index=(seed+i*7+Number(teamId||0))%sorted.length;
   events.push({gameId:game.id,teamId,playerId:sorted[index].id,type:'goal',sequence:i+1,experimental:true});
  }
 }
 return events;
}
function aggregateExperimentalGoals(events){
 const counts=new Map();
 for(const event of events){
  if(event.type!=='goal'||event.experimental!==true)throw new TypeError('Only experimental goal events supported');
  const id=String(event.playerId);counts.set(id,(counts.get(id)||0)+1);
 }
 return [...counts].map(([playerId,goals])=>({playerId,goals})).sort((a,b)=>b.goals-a.goals||a.playerId.localeCompare(b.playerId));
}
module.exports={buildExperimentalGoalEvents,aggregateExperimentalGoals};

},
"hlm-phase11-unified-box-scores.js":function(module,exports,require){
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMUnifiedBoxScores=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
/** Experimental box scores derived from authoritative roster-day goal events, not a second game simulation. */
function buildUnifiedBoxScores(state,games,goalEvents,seed=1){
 if(!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid seed');
 const output=[];const seen=new Set();
 for(const game of games){
  if(game.status!=='final')throw Error('Final game required');
  const id=String(game.id);
  if(seen.has(id))throw Error('Duplicate game');seen.add(id);
  const goaliePlan=state.extensions?.phase11GmGoaliePlan;
  const controlledTeamId=state.meta?.controlledTeamId;
  if(goaliePlan!=null&&[game.homeTeamId,game.awayTeamId].some(id=>String(id)===String(controlledTeamId))&&String(goaliePlan.teamId)!==String(controlledTeamId))throw Error('GM goalie plan does not match controlled team');
  const sides=[['home',game.homeTeamId,game.homeGoals],['away',game.awayTeamId,game.awayGoals]];
  const rows={};const eventKeys=new Set();
  for(const [side,teamId,goals] of sides){
   const skaters=eligibleExperimentalSkaters(state,teamId);
   const goalies=state.universe.players.filter(p=>String(p.teamId)===String(teamId)&&p.position==='G').sort((a,b)=>String(a.id).localeCompare(String(b.id)));
   if(!skaters.length||!goalies.length)throw Error('Missing roster participants');
   const players=skaters.map(p=>({playerId:p.id,goals:0,assists:0,shots:0,points:0}));
   const byId=new Map(players.map(p=>[String(p.playerId),p]));
   const events=goalEvents.filter(e=>String(e.gameId)===id&&String(e.teamId)===String(teamId));
   if(events.length!==goals)throw Error('Goal event score mismatch');
   for(const e of events){
    const key=id+':'+String(teamId)+':'+String(e.sequence);
    if(eventKeys.has(key))throw Error('Duplicate goal event');eventKeys.add(key);
    const scorer=byId.get(String(e.playerId));
    if(!scorer)throw Error('Scorer not on team');
    scorer.goals++;scorer.shots++;
    const eligible=players.filter(p=>String(p.playerId)!==String(e.playerId));
    const index=(seed+Number(e.sequence))%Math.max(1,eligible.length);
    if(eligible.length){eligible[index].assists++;if(eligible.length>1)eligible[(index+1)%eligible.length].assists++;}
   }
   // Non-goal shots are deterministically attributed without resimulating the result.
   const extra=6+(seed+id.length+String(teamId).length)%7;
   for(let i=0;i<extra;i++)players[(seed+i)%players.length].shots++;
   for(const p of players)p.points=p.goals+p.assists;
   const plan=goaliePlan;
   let selected=goalies[0];
   if(plan&&String(plan.teamId)===String(teamId)&&String(state.meta?.controlledTeamId)===String(teamId)){
    const matches=goalies.filter(p=>String(p.id)===String(plan.playerId));
    if(matches.length!==1)throw Error('Approved GM goalie plan is no longer valid for this roster');
    const injured=(state.activity?.injuries||[]).some(i=>String(i.playerId)===String(plan.playerId)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false);
    if(injured)throw Error('Approved GM goalie has an unresolved injury; simulation save blocked');
    selected=matches[0];
   }
   rows[side]={teamId,players,shots:players.reduce((n,p)=>n+p.shots,0),goals,goalie:{playerId:selected.id}};
  }
  for(const side of ['home','away']){
   const goalie=rows[side].goalie,opponent=rows[side==='home'?'away':'home'];
   goalie.shotsAgainst=opponent.shots;goalie.goalsAgainst=opponent.goals;
   goalie.saves=goalie.shotsAgainst-goalie.goalsAgainst;
   goalie.savePercentage=goalie.shotsAgainst?goalie.saves/goalie.shotsAgainst:null;
   if(goalie.saves<0)throw Error('Negative saves');
  }
  output.push({gameId:game.id,season:game.season??game.seasonId??null,playoff:Boolean(game.playoff||game.isPlayoff),home:rows.home,away:rows.away,experimental:true,official:false,attributionModel:'synthetic-from-roster-goals-v1'});
 }
 return output;
}
function eligibleExperimentalSkaters(state,teamId){
 if(!Array.isArray(state?.universe?.players))throw Error('Valid player roster required');
 const injured=id=>(state.activity?.injuries||[]).some(i=>String(i.playerId)===String(id)&&!['resolved','recovered'].includes(String(i.status||'').toLowerCase())&&i.active!==false);
 const eligible=state.universe.players.filter(p=>String(p.teamId)===String(teamId)&&['C','LW','RW','D','F'].includes(String(p.position||'').toUpperCase())&&!injured(p.id));
 const controlled=String(state.meta?.controlledTeamId)===String(teamId),plan=state.extensions?.phase11GmApprovedSkaters;
 if(!controlled||plan==null)return eligible.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 if(String(plan.teamId)!==String(teamId)||!Array.isArray(plan.playerIds)||plan.playerIds.length<3||new Set(plan.playerIds.map(String)).size!==plan.playerIds.length)throw Error('Invalid GM-approved skater participation plan');
 const ids=new Set(plan.playerIds.map(String));
 const selected=eligible.filter(p=>ids.has(String(p.id)));
 if(selected.length!==ids.size)throw Error('GM-approved skater is unavailable, injured, or no longer eligible');
 for(const p of selected){
  const rating=p.overall??p.ovr;
  if(!Number.isSafeInteger(rating)||rating<1||rating>99)throw Error('Rated GM-approved skater required');
 }
 return selected.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
}
/** Aggregate immutable game reports, keeping playoff and season boundaries separate. */
function aggregateUnifiedBoxScores(boxScores){
 const seasons=new Map();const games=new Set();
 for(const box of boxScores){
  if(!box||box.experimental!==true||box.official!==false)throw Error('Experimental report required');
  const gameKey=String(box.season??'unspecified')+':'+String(box.gameId);
  if(games.has(gameKey))throw Error('Duplicate season game box score');games.add(gameKey);
  const season=String(box.season??'unspecified'),kind=box.playoff?'playoffs':'regular';
  const key=season+':'+kind;
  if(!seasons.has(key))seasons.set(key,{season,kind,games:0,players:new Map(),goalies:new Map()});
  const bucket=seasons.get(key);bucket.games++;
  for(const side of ['home','away']){
   const team=box[side];
   if(team.players.reduce((n,p)=>n+p.goals,0)!==team.goals||team.players.reduce((n,p)=>n+p.shots,0)!==team.shots)throw Error('Team box score mismatch');
   for(const p of team.players){
    if(p.points!==p.goals+p.assists||p.shots<p.goals)throw Error('Player box score mismatch');
    const id=String(team.teamId)+':'+String(p.playerId);
    const row=bucket.players.get(id)||{teamId:team.teamId,playerId:p.playerId,games:0,goals:0,assists:0,shots:0,points:0};
    row.games++;for(const stat of ['goals','assists','shots','points'])row[stat]+=p[stat];
    bucket.players.set(id,row);
   }
   const g=team.goalie;
   if(g.saves+g.goalsAgainst!==g.shotsAgainst||g.saves<0)throw Error('Goalie box score mismatch');
   const id=String(team.teamId)+':'+String(g.playerId);
   const row=bucket.goalies.get(id)||{teamId:team.teamId,playerId:g.playerId,games:0,saves:0,shotsAgainst:0,goalsAgainst:0};
   row.games++;for(const stat of ['saves','shotsAgainst','goalsAgainst'])row[stat]+=g[stat];
   bucket.goalies.set(id,row);
  }
 }
 return [...seasons.values()].map(s=>({season:s.season,kind:s.kind,games:s.games,
  players:[...s.players.values()].sort((a,b)=>String(a.teamId).localeCompare(String(b.teamId))||String(a.playerId).localeCompare(String(b.playerId))),
  goalies:[...s.goalies.values()].map(g=>({...g,savePercentage:g.shotsAgainst?g.saves/g.shotsAgainst:null})).sort((a,b)=>String(a.teamId).localeCompare(String(b.teamId))||String(a.playerId).localeCompare(String(b.playerId))),
  experimental:true,official:false
 })).sort((a,b)=>a.season.localeCompare(b.season)||a.kind.localeCompare(b.kind));
}
return {buildUnifiedBoxScores,aggregateUnifiedBoxScores,eligibleExperimentalSkaters};
});

},
"hlm-phase10-playoffs.js":function(module,exports,require){
'use strict';
function seedPlayoffs(standings,spots=4) {
  if(!Array.isArray(standings)||!Number.isInteger(spots)||spots<2||spots>standings.length||spots%2)throw new RangeError('Invalid playoff field size');
  const ordered=standings.slice().sort((a,b)=>(b.points||0)-(a.points||0)||(b.w||0)-(a.w||0)||((b.gf||0)-(b.ga||0))-((a.gf||0)-(a.ga||0))||String(a.teamId).localeCompare(String(b.teamId)));
  const ids=ordered.map(row=>row.teamId);
  if(ids.some(id=>id==null)||new Set(ids.map(String)).size!==ids.length)throw new Error('Invalid team IDs');
  return ordered.slice(0,spots).map((row,index)=>({seed:index+1,teamId:row.teamId}));
}
function createPlayoffSeries(highSeed,lowSeed,bestOf=7) {
  if(!highSeed||!lowSeed||highSeed.teamId==null||lowSeed.teamId==null||highSeed.teamId===lowSeed.teamId)throw new Error('Series requires two different teams');
  if(!Number.isInteger(bestOf)||bestOf<1||bestOf%2!==1)throw new RangeError('Best-of must be a positive odd number');
  return {highSeed:{...highSeed},lowSeed:{...lowSeed},bestOf,games:[],wins:{[String(highSeed.teamId)]:0,[String(lowSeed.teamId)]:0},winnerTeamId:null,status:'active'};
}
function recordPlayoffGame(series,result) {
  if(!series||series.status!=='active')throw new Error('Series is not active');
  const ids=[series.highSeed.teamId,series.lowSeed.teamId];
  if(!result||!ids.includes(result.winnerTeamId)||result.homeTeamId===result.awayTeamId||!ids.includes(result.homeTeamId)||!ids.includes(result.awayTeamId)||result.status!=='final')throw new Error('Invalid series game result');
  if(result.gameId==null||series.games.some(g=>String(g.gameId)===String(result.gameId)))throw new Error('Duplicate or missing playoff game ID');
  const next=JSON.parse(JSON.stringify(series));
  next.games.push({...result});
  const key=String(result.winnerTeamId);
  next.wins[key]++;
  if(next.wins[key]>=Math.floor(next.bestOf/2)+1){next.status='complete';next.winnerTeamId=result.winnerTeamId;}
  return next;
}
module.exports={seedPlayoffs,createPlayoffSeries,recordPlayoffGame};

},
"hlm-phase10-playoff-bracket.js":function(module,exports,require){
'use strict';
const {createPlayoffSeries,recordPlayoffGame}=require('./hlm-phase10-playoffs');
function createPlayoffBracket(seeds,bestOf=7) {
  if(!Array.isArray(seeds)||seeds.length<2||(seeds.length&(seeds.length-1))!==0)throw new RangeError('Playoff field must be a power of two');
  const ordered=seeds.slice().sort((a,b)=>a.seed-b.seed);
  if(ordered.some((s,i)=>!s||!Number.isInteger(s.seed)||s.seed!==i+1||s.teamId==null)||new Set(ordered.map(s=>String(s.teamId))).size!==ordered.length)throw new Error('Seeds must be unique and numbered consecutively');
  const round=makeRound(ordered,bestOf);
  return {bestOf,rounds:[round],championTeamId:null,status:'active'};
}
function makeRound(seeds,bestOf){
  const matches=[];
  for(let i=0;i<seeds.length/2;i++)matches.push(createPlayoffSeries(seeds[i],seeds[seeds.length-1-i],bestOf));
  return matches;
}
function recordBracketGame(bracket,seriesIndex,result) {
  if(!bracket||bracket.status!=='active')throw new Error('Bracket is complete or invalid');
  const next=JSON.parse(JSON.stringify(bracket));
  const round=next.rounds[next.rounds.length-1];
  if(!Number.isInteger(seriesIndex)||seriesIndex<0||seriesIndex>=round.length)throw new RangeError('Invalid series index');
  round[seriesIndex]=recordPlayoffGame(round[seriesIndex],result);
  if(round.every(series=>series.status==='complete')){
    if(round.length===1){
      next.championTeamId=round[0].winnerTeamId;
      next.status='complete';
    }else{
      const advancing=round.map(series=>series.winnerTeamId===series.highSeed.teamId?series.highSeed:series.lowSeed).sort((a,b)=>a.seed-b.seed);
      next.rounds.push(makeRound(advancing,next.bestOf));
    }
  }
  return next;
}
module.exports={createPlayoffBracket,recordBracketGame};

},
"hlm-phase10-roster-playoff-game.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateRosterWeightedExhibition}=require('./hlm-phase10-roster-weighted-exhibition');
const {recordBracketGame}=require('./hlm-phase10-playoff-bracket');
/** Experimental roster-driven playoff game. Never persists or mutates input. */
function simulateExperimentalRosterPlayoffGame(state,seed=1){
 if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid GameState');
 if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Invalid playoff seed');
 const bracket=state.extensions.phase10Playoffs;
 if(!bracket||bracket.status!=='active')throw new Error('No active playoff bracket');
 const roundIndex=bracket.rounds.length-1,round=bracket.rounds[roundIndex];
 const seriesIndex=round.findIndex(s=>s.status==='active');
 if(seriesIndex<0)throw new Error('No active playoff series');
 const series=round[seriesIndex],gameNumber=series.games.length+1;
 const high=series.highSeed.teamId,low=series.lowSeed.teamId;
 const homeTeamId=[1,2,5,7].includes(gameNumber%7||7)?high:low;
 const awayTeamId=homeTeamId===high?low:high;
 const gameId='PO-R'+(roundIndex+1)+'-S'+(seriesIndex+1)+'-G'+gameNumber;
 const exhibition=simulateRosterWeightedExhibition(state,homeTeamId,awayTeamId,seed);
 if(!exhibition.playable)return {advanced:false,blockers:exhibition.blockers,nextState:null,exhibition,
  official:false,persistencePerformed:false};
 const result={gameId,homeTeamId,awayTeamId,status:'final',homeGoals:exhibition.score.homeGoals,
  awayGoals:exhibition.score.awayGoals,overtime:exhibition.score.overtime,
  winnerTeamId:exhibition.score.winnerTeamId,official:false,simulationMode:'experimental-roster-weighted'};
 const nextBracket=recordBracketGame(bracket,seriesIndex,result);
 const nextState=JSON.parse(JSON.stringify(state));
 nextState.extensions.phase10Playoffs=nextBracket;
 return {advanced:true,blockers:[],nextState,result,bracket:nextBracket,
  championTeamId:nextBracket.championTeamId,official:false,persistencePerformed:false};
}
module.exports={simulateExperimentalRosterPlayoffGame};

}
};const cache={};function load(id){if(!id.endsWith('.js'))id+='.js';if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Missing module '+id);const module={exports:{}};cache[id]=module;modules[id](module,module.exports,function(p){return load(p.replace(/^\.\//,''))});return module.exports;}global.HLMRosterLab=load('hlm-phase10-roster-lab-entry.js');})(window);
