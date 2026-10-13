/* Generated roster lab browser bundle */
(function(global){'use strict';const modules={
"hlm-phase10-roster-lab-entry.js":function(module,exports,require){
'use strict';
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalRosterSaveStore}=require('./hlm-phase10-roster-save-store');
const {calculateStandings}=require('./hlm-phase10-standings');
const {addCalendarDays}=require('./hlm-master-calendar');
function createRosterLabFranchise(){
 const teams=[{id:1,name:'Northport Wolves'},{id:2,name:'Lakeside Falcons'},{id:3,name:'Summit Bears'},{id:4,name:'Riverton Blades'}];
 const positions=['C','LW','RW','D','D','G'];
 const players=teams.flatMap(t=>positions.map((position,i)=>({id:t.id*100+i,teamId:t.id,position,ovr:72+t.id*3+i})));
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
 return createExperimentalRosterSaveStore({read:key=>storage.getItem(key),write:(key,value)=>storage.setItem(key,value)});
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
"hlm-phase10-roster-save-store.js":function(module,exports,require){
'use strict';
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');
const {simulateControlledRosterDay}=require('./hlm-phase10-controlled-roster-day');

/**
 * Experimental roster-backed save transaction. Uses an isolated key and
 * never reads/writes existing Front Office or default Phase 10 saves.
 */
function createExperimentalRosterSaveStore(adapter,key='hlm-phase10-roster-experimental-v1'){
 if(typeof key!=='string'||!key.startsWith('hlm-phase10-roster-experimental-')){
  const error=new Error('An isolated experimental save key is required');
  error.code='INVALID_ROSTER_EXPERIMENTAL_SAVE_KEY';throw error;
 }
 const store=createFranchiseSaveStore(adapter,key);
 function advanceAndSave(seed=1){
  const current=store.load();
  if(!current)throw new Error('No experimental roster franchise save found');
  const result=simulateControlledRosterDay(current,seed,{experimental:true});
  if(result.advanced)store.save(result.nextState);
  return {...result,saved:result.advanced};
 }
 return {load:store.load,save:store.save,advanceAndSave,key};
}
module.exports={createExperimentalRosterSaveStore};

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

}
};const cache={};function load(id){if(!id.endsWith('.js'))id+='.js';if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Missing module '+id);const module={exports:{}};cache[id]=module;modules[id](module,module.exports,function(p){return load(p.replace(/^\.\//,''))});return module.exports;}global.HLMRosterLab=load('hlm-phase10-roster-lab-entry.js');})(window);
