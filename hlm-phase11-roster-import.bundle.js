/* Generated Phase 11 import bundle */
(function(global){'use strict';const modules={
"hlm-phase11-roster-import-entry.js":function(module,exports,require){
'use strict';
const {mapExternalRoster,createVersionedImportStore}=require('./hlm-phase11-roster-mapping');
function createRosterImportController(storage){
 const store=createVersionedImportStore(storage);
 let stagedText=null;
 function preview(input){
  stagedText=null;
  if(typeof input!=='string'||input.length>5_000_000)throw new Error('Import exceeds 5MB');
  let source;try{source=JSON.parse(input)}catch(e){throw new Error('Invalid JSON input')}
  const normalized=source.format==='hlm-phase11-roster-import-v1'?input:mapExternalRoster(source);
  const summary=store.preview(normalized);
  stagedText=normalized;
  return summary;
 }
 function commit(confirm){
  if(!stagedText)throw new Error('Preview a roster before saving');
  const result=store.commit(stagedText,{confirm:confirm===true});
  stagedText=null;
  return result;
 }
 return {preview,commit,load:store.load,key:store.key};
}
module.exports={createRosterImportController};

},
"hlm-phase11-roster-mapping.js":function(module,exports,require){
'use strict';
const {previewRosterImport,stageRosterImport}=require('./hlm-phase11-roster-import');
const KEY='hlm-phase11-imported-franchise-v1';
function mapExternalRoster(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.teams)||!Array.isArray(raw.players))throw new Error('Expected teams and players arrays');
 const teams=raw.teams.map(t=>({id:t.id??t.teamId,name:t.name??t.teamName}));
 const names=new Map(teams.map(t=>[String(t.name).toLowerCase(),t.id]));
 const players=raw.players.map(p=>{
  const teamId=p.teamId??p.team_id??names.get(String(p.teamName??'').toLowerCase());
  const position=String(p.position??p.pos??'').toUpperCase();
  const normalizedPosition=position==='LD'||position==='RD'?'D':position==='GK'?'G':position;
  const overall=Number(p.ovr??p.overall);
  return {id:p.id??p.playerId,name:p.name??p.playerName,teamId,position:normalizedPosition,ovr:overall};
 });
 const text=JSON.stringify({format:'hlm-phase11-roster-import-v1',teams,players});
 previewRosterImport(text);
 return text;
}
function createVersionedImportStore(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw new TypeError('Storage API required');
 function preview(text){return previewRosterImport(text)}
 function load(){const saved=storage.getItem(KEY);return saved===null?null:JSON.parse(saved)}
 function commit(text,{confirm=false,startDate='2026-10-13'}={}){
  if(confirm!==true)throw new Error('Explicit import confirmation required');
  if(storage.getItem(KEY)!==null)throw new Error('Imported franchise already exists; use a new save or export and clear it explicitly');
  const state=stageRosterImport(text,{startDate});
  // Exclusive Phase 11 namespace; never read/write Front Office or Phase 10 keys.
  storage.setItem(KEY,JSON.stringify(state));
  return state;
 }
 return {key:KEY,preview,load,commit};
}
module.exports={mapExternalRoster,createVersionedImportStore};

},
"hlm-phase11-roster-import.js":function(module,exports,require){
'use strict';
const {createGameStateEnvelope,validateGameStateEnvelope}=require('./hlm-game-state');
const POSITIONS=new Set(['C','LW','RW','D','G']);
function parseRosterImport(text){
 if(typeof text!=='string'||text.length>5_000_000)throw new TypeError('Roster import must be JSON text under 5MB');
 let raw;try{raw=JSON.parse(text)}catch(e){throw new Error('Roster import is not valid JSON')}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Roster import must be an object');
 if(raw.format!=='hlm-phase11-roster-import-v1')throw new Error('Unsupported roster import format');
 if(!Array.isArray(raw.teams)||!Array.isArray(raw.players)||raw.teams.length<2||raw.teams.length>64||raw.players.length>4000)throw new Error('Invalid team/player counts');
 const teamIds=new Set(),playerIds=new Set();
 for(const t of raw.teams){
  if(!t||!Number.isSafeInteger(t.id)||t.id<=0||typeof t.name!=='string'||!t.name.trim()||t.name.length>100||teamIds.has(t.id))throw new Error('Invalid or duplicate team');
  teamIds.add(t.id);
 }
 for(const p of raw.players){
  if(!p||!Number.isSafeInteger(p.id)||p.id<=0||playerIds.has(p.id)||!teamIds.has(p.teamId)||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||!POSITIONS.has(p.position)||!Number.isInteger(p.ovr)||p.ovr<1||p.ovr>99)throw new Error('Invalid player, team mapping or overall');
  playerIds.add(p.id);
 }
 const counts=new Map(raw.teams.map(t=>[t.id,{players:0,goalies:0}]));
 for(const p of raw.players){const c=counts.get(p.teamId);c.players++;if(p.position==='G')c.goalies++}
 for(const c of counts.values())if(c.players<6||c.goalies<1)throw new Error('Each team needs at least six players including a goalie');
 return {teams:raw.teams.map(t=>({id:t.id,name:t.name.trim()})),players:raw.players.map(p=>({id:p.id,name:p.name.trim(),teamId:p.teamId,position:p.position,ovr:p.ovr})),format:raw.format};
}
function previewRosterImport(text){
 const roster=parseRosterImport(text);
 return {format:roster.format,teamCount:roster.teams.length,playerCount:roster.players.length,teamSummaries:roster.teams.map(t=>({id:t.id,name:t.name,players:roster.players.filter(p=>p.teamId===t.id).length})),writes:0};
}
function stageRosterImport(text,{startDate='2026-10-13'}={}){
 const roster=parseRosterImport(text);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!Number.isFinite(Date.parse(startDate+'T00:00:00Z')))throw new Error('Invalid start date');
 const state=createGameStateEnvelope({meta:{saveId:'phase11-roster-import-preview',currentDate:startDate,controlledTeamId:roster.teams[0].id},teams:roster.teams,players:roster.players});
 if(!validateGameStateEnvelope(state).valid)throw new Error('Staged roster failed state validation');
 return state;
}
module.exports={parseRosterImport,previewRosterImport,stageRosterImport};

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

}
};const cache={};function load(id){if(!id.endsWith('.js'))id+='.js';if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Missing module '+id);const module={exports:{}};cache[id]=module;modules[id](module,module.exports,function(p){return load(p.replace(/^\.\//,''))});return module.exports;}global.HLMRosterImport=load('hlm-phase11-roster-import-entry.js');})(window);
