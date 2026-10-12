/* Phase 10 browser bundle: generated from tested source modules */
(function(global){'use strict';var modules={
"hlm-phase10-browser-storage.js":function(module,exports,require){
'use strict';
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');

/**
 * Explicit browser localStorage adapter. Never accesses storage at import time.
 * The host must supply a Storage-compatible object.
 */
function createBrowserStorageAdapter(storage) {
  if (!storage || typeof storage.getItem!=='function' || typeof storage.setItem!=='function') {
    throw new TypeError('Storage must implement getItem and setItem');
  }
  return {
    read(key) {return storage.getItem(key);},
    write(key,value) {storage.setItem(key,value);}
  };
}
function createBrowserFranchiseSaveStore(storage,key='hlm-phase10-save') {
  return createFranchiseSaveStore(createBrowserStorageAdapter(storage),key);
}
module.exports={createBrowserStorageAdapter,createBrowserFranchiseSaveStore};

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
function simulateNextDay(state, seed=0) {
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
    const applied=applyScheduledGame(nextState,game.id,seed);
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
"hlm-phase10-apply-game.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');

/**
 * Apply one deterministic game result to a cloned save.
 * The caller owns persistence and standings projection.
 */
function applyScheduledGame(state, gameId, seed) {
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
  const result=simulateGameScore({gameId:game.id,homeTeamId:game.homeTeamId,awayTeamId:game.awayTeamId,seed});
  Object.assign(game,result);
  return {nextState,result};
}
module.exports={applyScheduledGame};

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
"hlm-phase10-game-simulator.js":function(module,exports,require){
'use strict';

/**
 * Deterministic prototype score simulator. Not a player-stat or standings engine.
 * Same matchup and seed always produce the same result.
 */
function simulateGameScore(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Game input must be an object');
  const {gameId, homeTeamId, awayTeamId, seed} = input;
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
  return Object.freeze({
    gameId, homeTeamId, awayTeamId,
    homeGoals: finalHome, awayGoals: finalAway,
    overtime, winnerTeamId: finalHome > finalAway ? homeTeamId : awayTeamId,
    status: 'final'
  });
}
module.exports = {simulateGameScore};

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
"hlm-phase10-season-playoffs.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {calculateStandings}=require('./hlm-phase10-standings');
const {seedPlayoffs}=require('./hlm-phase10-playoffs');
const {createPlayoffBracket}=require('./hlm-phase10-playoff-bracket');

/**
 * Pure regular-season -> playoff transition.
 * Only scheduled regular-season games block qualification.
 */
function startSeasonPlayoffs(state,spots=4,bestOf=7){
  const validation=validateGameStateEnvelope(state);
  if(!validation.valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(state.universe.teams)||state.universe.teams.length<spots)throw new Error('Not enough teams for playoffs');
  const games=state.activity.games;
  if(games.some(g=>!g||!['scheduled','final'].includes(g.status)))throw new Error('Invalid regular-season game status');
  if(games.some(g=>g.status==='scheduled'))throw new Error('Regular season has unplayed games');
  if(games.length===0)throw new Error('Cannot qualify playoffs without regular-season games');
  const standings=calculateStandings(state.universe.teams,games);
  const seeds=seedPlayoffs(standings,spots);
  const bracket=createPlayoffBracket(seeds,bestOf);
  const nextState=JSON.parse(JSON.stringify(state));
  if(nextState.extensions.phase10Playoffs)throw new Error('Playoffs already initialized');
  nextState.extensions.phase10Playoffs=bracket;
  return {nextState,standings,seeds,bracket};
}
module.exports={startSeasonPlayoffs};

},
"hlm-phase10-playoff-simulation.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');
const {recordBracketGame}=require('./hlm-phase10-playoff-bracket');

/** Simulate one playoff game, advancing the active bracket without mutating input. */
function simulateNextPlayoffGame(state,seed=0) {
  const validation=validateGameStateEnvelope(state);
  if(!validation.valid)throw new Error('Invalid franchise game state');
  if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Invalid simulation seed');
  const bracket=state.extensions.phase10Playoffs;
  if(!bracket||bracket.status!=='active')throw new Error('No active playoff bracket');
  const roundIndex=bracket.rounds.length-1;
  const round=bracket.rounds[roundIndex];
  const seriesIndex=round.findIndex(s=>s.status==='active');
  if(seriesIndex<0)throw new Error('No active playoff series');
  const series=round[seriesIndex];
  const gameNumber=series.games.length+1;
  const high=series.highSeed.teamId,low=series.lowSeed.teamId;
  const highHome=[1,2,5,7].includes(gameNumber%7||7);
  const homeTeamId=highHome?high:low,awayTeamId=highHome?low:high;
  const gameId='PO-R'+(roundIndex+1)+'-S'+(seriesIndex+1)+'-G'+gameNumber;
  const result=simulateGameScore({gameId,homeTeamId,awayTeamId,seed});
  const nextBracket=recordBracketGame(bracket,seriesIndex,result);
  const nextState=JSON.parse(JSON.stringify(state));
  nextState.extensions.phase10Playoffs=nextBracket;
  return {nextState,result,bracket:nextBracket,roundIndex,seriesIndex,championTeamId:nextBracket.championTeamId};
}
module.exports={simulateNextPlayoffGame};

}
};var cache={};function load(name){if(cache[name])return cache[name].exports;if(!modules[name])throw Error('Missing module '+name);var module={exports:{}};cache[name]=module;function localRequire(request){if(request.slice(0,2)!=='./')throw Error('Unsupported require '+request);return load(request.slice(2)+'.js')}modules[name](module,module.exports,localRequire);return module.exports;}var api={};for(var name of ['hlm-phase10-browser-storage.js','hlm-phase10-standings.js','hlm-master-calendar.js','hlm-game-state.js','hlm-phase10-season-playoffs.js','hlm-phase10-playoff-simulation.js'])Object.assign(api,load(name));global.HLMPhase10=api;})(typeof window!=='undefined'?window:globalThis);
