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
      // Only the controlled team's current, healthy, rated roster skaters participate.
      // Require three eligible skaters to avoid claiming lineup influence from incomplete rosters.
      const healthy=nextState.universe.players.filter(p=>String(p.teamId)===String(plan.teamId)&&['C','LW','RW','D','F'].includes(String(p.position||'').toUpperCase())&&!(nextState.activity.injuries||[]).some(i=>String(i.playerId)===String(p.id)&&i.status!=='resolved'&&i.status!=='recovered'&&i.active!==false));
      const approved=nextState.extensions?.phase11GmApprovedSkaters;
      let candidates=healthy;
      if(approved!==undefined){
        if(!approved||String(approved.teamId)!==String(plan.teamId)||!Array.isArray(approved.playerIds)||approved.playerIds.length<3||new Set(approved.playerIds.map(String)).size!==approved.playerIds.length)throw Error('Invalid GM-approved skater participation plan');
        const ids=new Set(approved.playerIds.map(String));
        candidates=healthy.filter(p=>ids.has(String(p.id)));
        if(candidates.length!==ids.size)throw Error('Approved skater is not eligible or is injured');
      }
      const eligible=candidates.filter(p=>Number.isSafeInteger(p.overall??p.ovr)&&(p.overall??p.ovr)>=1&&(p.overall??p.ovr)<=99);
      if(approved!==undefined&&eligible.length!==candidates.length)throw Error('Approved skater rating is unavailable');
      if(eligible.length>=3){
        input.experimentalVerifiedSkaterAverage=Math.round(eligible.reduce((total,p)=>total+(p.overall??p.ovr),0)/eligible.length);
        input.experimentalVerifiedSkaterSide=side;
      }
    }
  }
  const result=simulateGameScore(input);
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
  const rating=input.experimentalApprovedGoalieOverall;
  const skaterAverage=input.experimentalVerifiedSkaterAverage;
  if(skaterAverage!==undefined&&(!Number.isSafeInteger(skaterAverage)||skaterAverage<1||skaterAverage>99||!['home','away'].includes(input.experimentalVerifiedSkaterSide)||rating===undefined))throw Error('Invalid experimental verified skater average or side');
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

},
"hlm-phase10-complete-offseason.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {runOffseasonContractWindow}=require('./hlm-phase10-offseason-workflow');
const {selectDraftProspect}=require('./hlm-phase10-draft-selection');
const {beginNextSeason}=require('./hlm-phase10-next-season');
/** Execute approved offseason contracts, draft selections, and next season scheduling atomically. */
function completeOffseasonAndStartSeason(state,{contracts={},draftSelections=[],nextSeason}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(draftSelections))throw new TypeError('Draft selections must be an array');
  if(!nextSeason||typeof nextSeason!=='object')throw new TypeError('Next season configuration required');
  let current=runOffseasonContractWindow(state,contracts).nextState;
  const selections=[];
  for(const input of draftSelections){
    const result=selectDraftProspect(current,input);
    current=result.nextState;
    selections.push(result.selection);
  }
  const {nextState,summary}=beginNextSeason(current,nextSeason);
  return {nextState,summary:{season:summary,expiredContracts:contracts.expiredContractIds?.length??0,signings:contracts.signings?.length??0,draftSelections:selections}};
}
module.exports={completeOffseasonAndStartSeason};

},
"hlm-phase10-offseason-workflow.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {expireOffseasonContracts}=require('./hlm-phase10-offseason-contracts');
const {listOffseasonFreeAgents}=require('./hlm-phase10-free-agency');
const {signOffseasonFreeAgent}=require('./hlm-phase10-free-agent-signing');
/** Apply explicit offseason operations atomically to a cloned franchise save. */
function runOffseasonContractWindow(state,{expiredContractIds=[],signings=[]}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(expiredContractIds)||!Array.isArray(signings))throw new TypeError('Offseason operations must be arrays');
  let current=expireOffseasonContracts(state,expiredContractIds).nextState;
  const freeAgentsBefore=listOffseasonFreeAgents(current).count;
  const executed=[];
  for(const signing of signings){
    const result=signOffseasonFreeAgent(current,signing);
    current=result.nextState;
    executed.push(result.summary);
  }
  return {nextState:current,summary:{expiredCount:expiredContractIds.length,freeAgentsBefore,signings:executed,freeAgentsAfter:listOffseasonFreeAgents(current).count}};
}
module.exports={runOffseasonContractWindow};

},
"hlm-phase10-offseason-contracts.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/**
 * Explicit offseason expiration transaction.
 * Call only with verified expiring contract IDs from the season rules engine.
 * Does not guess expiry from ambiguous years/season fields.
 */
function expireOffseasonContracts(state,contractIds){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(contractIds))throw new TypeError('Contract IDs must be an array');
  const ids=contractIds.map(String);
  if(new Set(ids).size!==ids.length)throw new Error('Duplicate contract IDs');
  const contracts=state.assets.contracts;
  for(const id of ids){
    const matches=contracts.filter(c=>c&&(c.contractId??c.id)!=null&&String(c.contractId??c.id)===id);
    if(matches.length!==1)throw new Error('Contract ID missing or ambiguous: '+id);
    if(matches[0].status==='expired')throw new Error('Contract already expired: '+id);
  }
  const selected=new Set(ids);
  const nextState=JSON.parse(JSON.stringify(state));
  const expired=[];
  for(const contract of nextState.assets.contracts){
    if(contract&&(contract.contractId??contract.id)!=null&&selected.has(String(contract.contractId??contract.id))){
      contract.status='expired';
      expired.push(String(contract.contractId??contract.id));
    }
  }
  return {nextState,summary:{expiredContractIds:expired,expiredCount:expired.length,unchangedCount:contracts.length-expired.length}};
}
module.exports={expireOffseasonContracts};

},
"hlm-phase10-free-agency.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/** Read-only free-agent pool based on explicitly expired contract records. */
function listOffseasonFreeAgents(state){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  const players=new Map(state.universe.players.filter(p=>p&&p.id!=null).map(p=>[String(p.id),p]));
  const activePlayers=new Set(state.assets.contracts.filter(c=>c&&c.status!=='expired'&&c.playerId!=null).map(c=>String(c.playerId)));
  const freeAgents=new Map();
  for(const c of state.assets.contracts){
    if(!c||c.status!=='expired'||c.playerId==null)continue;
    const key=String(c.playerId);
    if(activePlayers.has(key)||!players.has(key))continue;
    const p=players.get(key);
    freeAgents.set(key,{playerId:p.id,name:p.name??null,previousTeamId:c.teamId??null});
  }
  return {freeAgents:[...freeAgents.values()].sort((a,b)=>String(a.playerId).localeCompare(String(b.playerId))),count:freeAgents.size};
}
module.exports={listOffseasonFreeAgents};

},
"hlm-phase10-free-agent-signing.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/** Sign a free agent to a team using explicit cap room and canonical contract fields. */
function signOffseasonFreeAgent(state,{playerId,teamId,contractId,aav,years,season,capLimit}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(playerId==null||teamId==null||typeof contractId!=='string'||!contractId.trim())throw new TypeError('Player, team and contract ID required');
  if(!state.universe.teams.some(t=>String(t.id)===String(teamId)))throw new Error('Team not found');
  const hasExpired=state.assets.contracts.some(c=>c&&c.status==='expired'&&String(c.playerId)===String(playerId));
  const hasActive=state.assets.contracts.some(c=>c&&c.status!=='expired'&&String(c.playerId)===String(playerId));
  if(!hasExpired||hasActive||!state.universe.players.some(p=>String(p.id)===String(playerId)))throw new Error('Player is not an eligible free agent');
  if(state.assets.contracts.some(c=>String(c.contractId??c.id)===contractId))throw new Error('Contract ID already exists');
  if(!Number.isFinite(aav)||aav<0||!Number.isSafeInteger(years)||years<1||years>15)throw new RangeError('Invalid salary or term');
  if(typeof season!=='string'||!season.trim())throw new TypeError('Season is required');
  if(!Number.isFinite(capLimit)||capLimit<0)throw new RangeError('Valid cap limit required');
  const activePayroll=state.assets.contracts.filter(c=>String(c.teamId)===String(teamId)&&c.status!=='expired').reduce((sum,c)=>sum+Number(c.aav||0),0);
  if(state.assets.contracts.some(c=>String(c.teamId)===String(teamId)&&c.status!=='expired'&&(!Number.isFinite(Number(c.aav))||Number(c.aav)<0)))throw new Error('Existing payroll has invalid salaries');
  if(activePayroll+aav>capLimit)throw new Error('Signing exceeds salary cap');
  const nextState=JSON.parse(JSON.stringify(state));
  const contract={contractId,playerId,teamId,aav,years,season,status:'active'};
  nextState.assets.contracts.push(contract);
  // The approved signing must change the actual team roster, not only its contract ledger.
  const signedPlayer=nextState.universe.players.find(p=>String(p.id)===String(playerId));
  signedPlayer.teamId=teamId;
  return {nextState,contract,summary:{playerId,teamId,contractId,projectedPayroll:activePayroll+aav,capSpace:capLimit-activePayroll-aav}};
}
module.exports={signOffseasonFreeAgent};


},
"hlm-phase10-draft-selection.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/** Execute a single verified draft selection; no automatic lottery or trade resolution. */
function selectDraftProspect(state,{pickId,prospectId,teamId}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(pickId==null||prospectId==null||teamId==null)throw new TypeError('Pick, prospect and team required');
  const picks=state.assets.draftPicks.filter(p=>p&&String(p.pickId??p.id)===String(pickId));
  if(picks.length!==1)throw new Error('Draft pick missing or ambiguous');
  const pick=picks[0];
  if(String(pick.currentOwnerId)!==String(teamId))throw new Error('Team does not own pick');
  if(pick.selectedProspectId!=null||pick.status==='used')throw new Error('Draft pick already used');
  if(!state.universe.teams.some(t=>String(t.id)===String(teamId)))throw new Error('Team not found');
  const prospects=state.universe.prospects.filter(p=>p&&String(p.id)===String(prospectId));
  if(prospects.length!==1)throw new Error('Prospect missing or ambiguous');
  if(prospects[0].draftedByTeamId!=null||prospects[0].draftPickId!=null)throw new Error('Prospect already drafted');
  const nextState=JSON.parse(JSON.stringify(state));
  const nextPick=nextState.assets.draftPicks.find(p=>String(p.pickId??p.id)===String(pickId));
  const nextProspect=nextState.universe.prospects.find(p=>String(p.id)===String(prospectId));
  nextPick.selectedProspectId=nextProspect.id;
  nextPick.status='used';
  nextProspect.draftedByTeamId=teamId;
  nextProspect.draftPickId=pickId;
  return {nextState,selection:{pickId,prospectId,teamId}};
}
module.exports={selectDraftProspect};

},
"hlm-phase10-next-season.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertIsoDate}=require('./hlm-master-calendar');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
/**
 * Start a new regular season only after the prior championship has been archived.
 * Preserves rosters, contracts, franchise history and the input save unchanged.
 * Does not perform draft, free agency or contract expiration.
 */
function beginNextSeason(state,{completedSeasonId,nextSeasonId,startDate,cycles=2}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(typeof completedSeasonId!=='string'||!completedSeasonId.trim())throw new TypeError('Completed season ID is required');
  if(typeof nextSeasonId!=='string'||!nextSeasonId.trim()||nextSeasonId===completedSeasonId)throw new TypeError('Distinct next season ID is required');
  assertIsoDate(startDate);
  if(!state.history.seasons.some(s=>s.seasonId===completedSeasonId))throw new Error('Previous championship must be archived');
  if(state.history.seasons.some(s=>s.seasonId===nextSeasonId))throw new Error('Next season already archived');
  if(state.extensions.phase10CurrentSeasonId===nextSeasonId)throw new Error('Next season already initialized');
  if(state.activity.games.some(g=>g.status!=='final'))throw new Error('Previous regular season is unfinished');
  if(!state.extensions.phase10Playoffs||state.extensions.phase10Playoffs.status!=='complete')throw new Error('Previous playoffs are unfinished');
  if(state.meta.currentDate&&startDate<=state.meta.currentDate)throw new Error('Next season must begin after championship date');
  const schedule=generateRoundRobinSchedule(state.universe.teams,startDate,cycles);
  const nextState=JSON.parse(JSON.stringify(state));
  nextState.activity.games=schedule;
  nextState.meta.currentDate=startDate;
  delete nextState.extensions.phase10Playoffs;
  nextState.extensions.phase10CurrentSeasonId=nextSeasonId;
  return {nextState,summary:{completedSeasonId,nextSeasonId,startDate,scheduledGames:schedule.length,archivedSeasons:nextState.history.seasons.length}};
}
module.exports={beginNextSeason};

},
"hlm-phase10-season-schedule.js":function(module,exports,require){
'use strict';
const {assertIsoDate,addCalendarDays}=require('./hlm-master-calendar');

/**
 * Deterministic round-robin schedule generator.
 * Every distinct pair plays once per cycle; reverse home/away each second cycle.
 */
function generateRoundRobinSchedule(teams,startDate,cycles=2) {
  assertIsoDate(startDate);
  if (!Array.isArray(teams) || teams.length<2) throw new TypeError('At least two teams required');
  if (!Number.isSafeInteger(cycles) || cycles<1 || cycles>20) throw new RangeError('Cycles must be 1 through 20');
  const ids=teams.map(team=>team && team.id);
  if(ids.some(id=>id==null)||new Set(ids.map(String)).size!==ids.length)throw new Error('Team IDs must be unique and present');
  const entries=ids.slice();
  if(entries.length%2)entries.push(null);
  const rounds=entries.length-1;
  const half=entries.length/2;
  const games=[];
  let day=1;
  for(let cycle=0;cycle<cycles;cycle++){
    const rotation=entries.slice();
    for(let round=0;round<rounds;round++){
      const date=addCalendarDays(startDate,day++);
      for(let i=0;i<half;i++){
        const first=rotation[i],second=rotation[rotation.length-1-i];
        if(first==null||second==null)continue;
        const flip=(round+i+cycle)%2===1;
        const homeTeamId=flip?second:first;
        const awayTeamId=flip?first:second;
        games.push({id:'S'+cycle+'-R'+round+'-G'+i,date,status:'scheduled',homeTeamId,awayTeamId});
      }
      rotation.splice(1,0,rotation.pop());
    }
  }
  return games;
}
module.exports={generateRoundRobinSchedule};

},
"hlm-phase10-season-history.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {calculateStandings}=require('./hlm-phase10-standings');
/** Archive a completed championship season once without modifying the input. */
function archiveCompletedSeason(state,seasonId){
  const validation=validateGameStateEnvelope(state);
  if(!validation.valid)throw new Error('Invalid franchise game state');
  if(typeof seasonId!=='string'||!seasonId.trim())throw new TypeError('Season ID is required');
  const bracket=state.extensions.phase10Playoffs;
  if(!bracket||bracket.status!=='complete'||bracket.championTeamId==null)throw new Error('Championship is not complete');
  if(state.activity.games.some(g=>g.status!=='final'))throw new Error('Regular season is not complete');
  if(state.history.seasons.some(s=>s.seasonId===seasonId))throw new Error('Season already archived');
  const standings=calculateStandings(state.universe.teams,state.activity.games);
  const record={seasonId,championTeamId:bracket.championTeamId,completedDate:state.meta.currentDate,standings,playoffRounds:JSON.parse(JSON.stringify(bracket.rounds)),regularSeasonGames:state.activity.games.length};
  const nextState=JSON.parse(JSON.stringify(state));
  nextState.history.seasons.push(record);
  return {nextState,record};
}
module.exports={archiveCompletedSeason};

},
"hlm-phase10-season-finalization.js":function(module,exports,require){
'use strict';
const {archiveCompletedSeason}=require('./hlm-phase10-season-history');
/** Safely archive the finished season and return a compact, display-ready summary. */
function finalizeChampionshipSeason(state,seasonId){
  const {nextState,record}=archiveCompletedSeason(state,seasonId);
  const standings=record.standings;
  return {nextState,summary:{
    seasonId:record.seasonId,
    championTeamId:record.championTeamId,
    completedDate:record.completedDate,
    regularSeasonGames:record.regularSeasonGames,
    playoffRoundCount:record.playoffRounds.length,
    standingsCount:standings.length,
    archivedSeasonCount:nextState.history.seasons.length
  }};
}
module.exports={finalizeChampionshipSeason};

},
"hlm-phase11-drafted-prospect-signing.js":function(module,exports,require){
'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');

/** Explicit human-GM approved signing of an owned unsigned drafted prospect. */
function signDraftedProspect(state,{prospectId,teamId,contractId,aav,years,season,capLimit}={}){
 if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
 if(prospectId==null||teamId==null||typeof contractId!=='string'||!contractId.trim())throw new TypeError('Prospect, team and contract ID required');
 if(!state.universe.teams.some(t=>String(t.id)===String(teamId)))throw new Error('Team not found');
 const matches=state.universe.prospects.filter(p=>p&&String(p.id)===String(prospectId));
 if(matches.length!==1)throw new Error('Prospect missing or ambiguous');
 const prospect=matches[0];
 if(String(prospect.draftedByTeamId)!==String(teamId)||prospect.draftPickId==null)throw new Error('Team does not own drafted prospect rights');
 const picks=state.assets.draftPicks.filter(p=>p&&String(p.pickId??p.id)===String(prospect.draftPickId));
 if(picks.length!==1||String(picks[0].currentOwnerId)!==String(teamId)||String(picks[0].selectedProspectId)!==String(prospectId)||picks[0].status!=='used')throw new Error('Draft rights do not match completed pick');
 if(prospect.signedContractId!=null||state.universe.players.some(p=>String(p.id)===String(prospectId))||state.assets.contracts.some(c=>String(c.playerId)===String(prospectId)))throw new Error('Prospect already signed or player ID in use');
 if(state.assets.contracts.some(c=>String(c.contractId??c.id)===contractId))throw new Error('Contract ID already exists');
 if(!Number.isFinite(aav)||aav<0||!Number.isSafeInteger(years)||years<1||years>15)throw new RangeError('Invalid salary or term');
 if(typeof season!=='string'||!season.trim())throw new TypeError('Season is required');
 if(!Number.isFinite(capLimit)||capLimit<0)throw new RangeError('Valid cap limit required');
 const active=state.assets.contracts.filter(c=>String(c.teamId)===String(teamId)&&c.status!=='expired');
 if(active.some(c=>!Number.isFinite(Number(c.aav))||Number(c.aav)<0))throw new Error('Existing payroll has invalid salaries');
 const payroll=active.reduce((sum,c)=>sum+Number(c.aav),0);
 if(payroll+aav>capLimit)throw new Error('Signing exceeds salary cap');
 const nextState=JSON.parse(JSON.stringify(state));
 const signed=nextState.universe.prospects.find(p=>String(p.id)===String(prospectId));
 signed.signedContractId=contractId;
 const player={...signed,teamId};
 delete player.draftedByTeamId;
 delete player.draftPickId;
 delete player.signedContractId;
 nextState.universe.players.push(player);
 const contract={contractId,playerId:prospectId,teamId,aav,years,season,status:'active'};
 nextState.assets.contracts.push(contract);
 return {nextState,contract,summary:{prospectId,teamId,contractId,projectedPayroll:payroll+aav,capSpace:capLimit-payroll-aav}};
}
module.exports={signDraftedProspect};

},
};var cache={};function load(name){if(cache[name])return cache[name].exports;if(!modules[name])throw Error('Missing module '+name);var module={exports:{}};cache[name]=module;function localRequire(request){if(request.slice(0,2)!=='./')throw Error('Unsupported require '+request);return load(request.slice(2)+'.js')}modules[name](module,module.exports,localRequire);return module.exports;}var api={};for(var name of ['hlm-phase10-browser-storage.js','hlm-phase10-standings.js','hlm-master-calendar.js','hlm-game-state.js','hlm-phase10-season-playoffs.js','hlm-phase10-playoff-simulation.js','hlm-phase10-complete-offseason.js','hlm-phase10-season-finalization.js','hlm-phase10-season-schedule.js','hlm-phase10-simulate-day.js','hlm-phase10-apply-game.js','hlm-phase11-drafted-prospect-signing.js'])Object.assign(api,load(name));global.HLMPhase10=api;})(typeof window!=='undefined'?window:globalThis);
