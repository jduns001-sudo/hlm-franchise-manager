/* Mission 1507M: browser-only bundle of existing pure trade review modules. No save writes. */
(function(root){'use strict';
const factories=Object.create(null),cache=Object.create(null);
function require(id){const key=id.replace(/^\.\//,'').replace(/\.js$/,'');if(!factories[key])throw Error('Unknown isolated trade module');if(!cache[key]){const module={exports:{}};cache[key]=module;factories[key](module,module.exports,require)}return cache[key].exports}
factories["hlm-game-state"]=function(module,exports,require){
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

};
factories["hlm-phase11-trade-financial-eligibility"]=function(module,exports,require){
'use strict';
/* Mission 1445: read-only, fail-closed financial eligibility. Never authorizes a trade. */
const {validateGameStateEnvelope}=require('./hlm-game-state');
function evaluateTradeEligibility(state,{outgoingPlayerId,incomingPlayerId,controlledTeamId}={}){
 if(!validateGameStateEnvelope(state).valid)throw Error('Valid GameState envelope required');
 const controlled=String(state.meta.controlledTeamId??'');
 if(!controlled||String(controlledTeamId)!==controlled)throw Error('Controlled team authority required');
 const players=state.universe.players,teams=state.universe.teams;
 const find=id=>players.filter(p=>p&&String(p.id)===String(id));
 const out=find(outgoingPlayerId),incoming=find(incomingPlayerId);
 if(out.length!==1||incoming.length!==1||String(out[0].id)===String(incoming[0].id))throw Error('Distinct uniquely sourced players required');
 const a=out[0],b=incoming[0],other=String(b.teamId??'');
 if(String(a.teamId)!==controlled||other===controlled||!teams.some(t=>String(t.id)===other))throw Error('Invalid trade ownership');
 const contracts=state.assets.contracts;
 const getContract=p=>contracts.filter(c=>c&&String(c.playerId)===String(p.id)&&c.status==='active');
 const ac=getContract(a),bc=getContract(b);
 if(ac.length!==1||bc.length!==1)throw Error('Exactly one authoritative active contract per player required');
 if(String(ac[0].teamId)!==controlled||String(bc[0].teamId)!==other)throw Error('Contract ownership mismatch');
 if(![ac[0].aav,bc[0].aav].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))throw Error('Verified contract AAV required');
 // Cap limits must originate in the saved franchise, never be supplied by the caller.
 const cap=state.finances?.teamCapLimits;
 if(!cap||!Number.isFinite(cap[controlled])||!Number.isFinite(cap[other]))throw Error('Source-backed team cap limits unavailable');
 const payroll=id=>{
  const active=contracts.filter(c=>String(c.teamId)===id&&c.status==='active');
  if(active.some(c=>typeof c.aav!=='number'||!Number.isFinite(c.aav)||c.aav<0))throw Error('Unverifiable team payroll');
  return active.reduce((n,c)=>n+c.aav,0);
 };
 const afterA=payroll(controlled)-ac[0].aav+bc[0].aav,afterB=payroll(other)-bc[0].aav+ac[0].aav;
 if(afterA>cap[controlled]||afterB>cap[other])throw Error('Trade exceeds verified salary cap');
 // No inferred no-trade clauses, roster limits, or receiving-team consent.
 return Object.freeze({eligibleForFurtherReview:true,settlementAuthorized:false,controlledTeamId:controlled,otherTeamId:other,projectedPayroll:{[controlled]:afterA,[other]:afterB},reason:'Restrictions, roster rules and receiving-team consent require independent verification'});
}
module.exports={evaluateTradeEligibility};

};
factories["hlm-phase11-trade-restrictions"]=function(module,exports,require){
'use strict';
/* Mission 1445: read-only trade restriction and roster eligibility. Missing authority blocks review. */
const {validateGameStateEnvelope}=require('./hlm-game-state');
function evaluateTradeRestrictions(state,{outgoingPlayerId,incomingPlayerId,controlledTeamId}={}){
 if(!validateGameStateEnvelope(state).valid)throw Error('Valid GameState required');
 const controlled=String(state.meta.controlledTeamId??'');
 if(!controlled||String(controlledTeamId)!==controlled)throw Error('Controlled GM authority required');
 const players=state.universe.players,teams=state.universe.teams;
 const matches=id=>players.filter(p=>p&&String(p.id)===String(id));
 const a=matches(outgoingPlayerId),b=matches(incomingPlayerId);
 if(a.length!==1||b.length!==1||String(a[0].id)===String(b[0].id))throw Error('Two distinct sourced players required');
 const other=String(b[0].teamId??'');
 if(String(a[0].teamId)!==controlled||other===controlled||!teams.some(t=>String(t.id)===other))throw Error('Invalid team ownership');
 const active=state.assets.contracts;
 for(const p of [a[0],b[0]]){
  const cs=active.filter(c=>String(c.playerId)===String(p.id)&&c.status==='active');
  if(cs.length!==1||String(cs[0].teamId)!==String(p.teamId))throw Error('Authoritative active contract required');
  // Restriction records must explicitly attest transfer permission. Unknown is not permission.
  if(cs[0].tradePermission!=='allowed')throw Error('Trade restriction permission unverified');
  if(p.status==='retired'||p.status==='suspended')throw Error('Ineligible player status');
 }
 const limits=state.extensions?.tradeRosterLimits;
 if(!limits||!Number.isSafeInteger(limits[controlled])||!Number.isSafeInteger(limits[other]))throw Error('Source-backed roster limits unavailable');
 const count=id=>players.filter(p=>String(p.teamId)===id).length;
 if(count(controlled)>limits[controlled]||count(other)>limits[other])throw Error('Roster already exceeds sourced limit');
 // Equal-size exchange preserves each team's roster count. This is NOT AI consent.
 return Object.freeze({eligibleForFurtherReview:true,settlementAuthorized:false,otherTeamId:other,reason:'Receiving-team consent and complete game integration remain unverified'});
}
module.exports={evaluateTradeRestrictions};

};
factories["hlm-phase11-m1507h-trade-proposal"]=function(module,exports,require){
'use strict';
/* Mission 1507H: pure, source-backed trade settlement PROPOSAL.
 * No CPU authority, save adapter, or production activation. Settlement remains blocked.
 */
const {evaluateTradeEligibility}=require('./hlm-phase11-trade-financial-eligibility');
const {evaluateTradeRestrictions}=require('./hlm-phase11-trade-restrictions');
function propose(state,input){
 const controlledTeamId=state?.meta?.controlledTeamId;
 const args={outgoingPlayerId:input?.outgoingPlayerId,incomingPlayerId:input?.incomingPlayerId,controlledTeamId};
 const financial=evaluateTradeEligibility(state,args);
 const restrictions=evaluateTradeRestrictions(state,args);
 if(String(financial.otherTeamId)!==String(restrictions.otherTeamId))throw Error('Conflicting receiving franchise');
 const before=JSON.stringify(state);
 const nextState=JSON.parse(before);
 const outgoing=nextState.universe.players.find(p=>String(p.id)===String(args.outgoingPlayerId));
 const incoming=nextState.universe.players.find(p=>String(p.id)===String(args.incomingPlayerId));
 const outContract=nextState.assets.contracts.find(c=>String(c.playerId)===String(args.outgoingPlayerId)&&c.status==='active');
 const inContract=nextState.assets.contracts.find(c=>String(c.playerId)===String(args.incomingPlayerId)&&c.status==='active');
 if(!outgoing||!incoming||!outContract||!inContract)throw Error('Missing sourced trade asset');
 const from=outgoing.teamId,to=incoming.teamId;
 outgoing.teamId=to;incoming.teamId=from;
 outContract.teamId=to;inContract.teamId=from;
 // Re-evaluate the unchanged source after constructing the preview; never persist or authorize it.
 if(JSON.stringify(state)!==before)throw Error('Source changed during review');
 return Object.freeze({nextState,review:Object.freeze({
  outgoingPlayerId:outgoing.id,incomingPlayerId:incoming.id,controlledTeamId:String(from),otherTeamId:String(to),
  projectedPayroll:financial.projectedPayroll,financialReviewed:true,restrictionsReviewed:true,
  requiresHumanGmApproval:true,requiresIndependentCpuConsent:true,
  settlementAuthorized:false,saved:false,experimental:true,
  reason:'Independent CPU authority and atomic guarded settlement adapter are unavailable'
 })});
}
module.exports={propose};

};
factories["hlm-phase11-m1507i-trade-invariant-gate"]=function(module,exports,require){
'use strict';
/* Mission 1507I: read-only cross-asset trade proposal invariant gate.
 * Validates a detached proposal; never approves, authenticates CPU consent or saves.
 */
const {propose}=require('./hlm-phase11-m1507h-trade-proposal');
function inspect(state,input,candidate){
 const blocked=(code)=>Object.freeze({status:'trade-proposal-blocked',code,settlementAuthorized:false,saved:false,experimental:true});
 let expected;
 try{expected=propose(state,input).nextState}catch{return blocked('invalid-source-proposal')}
 if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))return blocked('missing-candidate');
 let actual,reference;
 try{actual=JSON.stringify(candidate);reference=JSON.stringify(expected)}
 catch{return blocked('unserializable-candidate')}
 if(actual!==reference)return blocked('cross-asset-invariant-mismatch');
 return Object.freeze({status:'trade-proposal-invariants-verified',sourceBacked:true,
  playerAndContractOwnershipConsistent:true,unrelatedAssetsUnchanged:true,
  independentCpuConsentVerified:false,humanGmSettlementApproved:false,
  settlementAuthorized:false,saved:false,experimental:true,
  reason:'Atomic settlement and independent receiving-team authority are not available'});
}
module.exports={inspect};

};
factories["hlm-phase11-m1507k-cpu-trade-policy"]=function(module,exports,require){
'use strict';
/* Mission 1507K: deterministic CPU trade valuation ADVICE, not authority or consent.
 * No mutable storage, no settlement and no user-supplied override of source values.
 */
const {propose}=require('./hlm-phase11-m1507h-trade-proposal');
const {inspect}=require('./hlm-phase11-m1507i-trade-invariant-gate');
function evaluate(state,input){
 const deny=(code)=>Object.freeze({status:'cpu-trade-evaluation-blocked',code,
  recommendation:'manual-review',authenticatedCpuConsent:false,settlementAuthorized:false,saved:false,experimental:true});
 let preview;
 try{preview=propose(state,input)}catch{return deny('source-eligibility-failed')}
 if(inspect(state,input,preview.nextState).status!=='trade-proposal-invariants-verified')return deny('invariant-check-failed');
 const players=state.universe.players;
 const outgoing=players.find(p=>String(p.id)===String(input.outgoingPlayerId));
 const incoming=players.find(p=>String(p.id)===String(input.incomingPlayerId));
 // Existing numeric overall is the ONLY value signal; do not fabricate missing ratings.
 if(!Number.isInteger(outgoing?.overall)||!Number.isInteger(incoming?.overall)||
  outgoing.overall<0||outgoing.overall>100||incoming.overall<0||incoming.overall>100)
  return deny('source-backed-player-valuations-unavailable');
 const receivingGain=outgoing.overall-incoming.overall;
 const recommendation=receivingGain>0?'favorable-for-receiving-team':
  receivingGain<0?'unfavorable-for-receiving-team':'even-rating-exchange';
 return Object.freeze({status:'cpu-trade-evaluation-preview',recommendation,
  receivingTeamRatingDelta:receivingGain,source:'current-isolated-universe-overall',
  authenticatedCpuConsent:false,settlementAuthorized:false,saved:false,experimental:true,
  reason:'Overall-only scouting signal; independent CPU authority and settlement are unavailable'});
}
module.exports={evaluate};

};
factories["hlm-phase11-m1507j-guarded-trade-workflow"]=function(module,exports,require){
'use strict';
/* Mission 1507J: isolated, fail-closed GM trade workflow. No storage writes.
 * An in-memory candidate is NOT CPU consent or a settlement authorization.
 */
const {propose}=require('./hlm-phase11-m1507h-trade-proposal');
const {inspect}=require('./hlm-phase11-m1507i-trade-invariant-gate');
const {evaluate}=require('./hlm-phase11-m1507k-cpu-trade-policy');
function create(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof key!=='string'||!key||
  key==='hlm_front_office_v8'||!key.startsWith('hlm-phase11-'))
  throw Error('Explicit Phase 11 isolated franchise storage required');
 let baseline=storage.getItem(key),pending=null;
 const deny=(code)=>Object.freeze({status:'trade-settlement-blocked',code,saved:false,settlementAuthorized:false,experimental:true});
 function reload(){baseline=storage.getItem(key);pending=null;return baseline?JSON.parse(baseline):null}
 function review(input){
  pending=null;
  if(storage.getItem(key)!==baseline)return deny('stale-save');
  if(!baseline)return deny('missing-isolated-save');
  let source;
  try{source=JSON.parse(baseline)}catch{return deny('invalid-save')}
  let preview,verified;
  try{
   preview=propose(source,input);
   verified=inspect(source,input,preview.nextState);
  }catch{return deny('invalid-proposal')}
  if(verified.status!=='trade-proposal-invariants-verified')return deny('invariants-failed');
  if(storage.getItem(key)!==baseline)return deny('stale-save');
  const cpuEvaluation=evaluate(source,input);
  pending={baseline,input:JSON.parse(JSON.stringify(input)),candidate:JSON.stringify(preview.nextState)};
  return Object.freeze({status:'awaiting-human-GM-decision',review:preview.review,cpuEvaluation,
   settlementAuthorized:false,saved:false,experimental:true});
 }
 function decide(action){
  if(!['approve','decline','cancel'].includes(action))throw Error('Explicit GM trade decision required');
  if(!pending)return deny('review-required');
  const p=pending;pending=null;
  if(storage.getItem(key)!==baseline||p.baseline!==baseline)return deny('stale-save');
  if(action!=='approve')return deny(action);
  let source;
  try{source=JSON.parse(baseline)}catch{return deny('invalid-save')}
  const verified=inspect(source,p.input,JSON.parse(p.candidate));
  if(verified.status!=='trade-proposal-invariants-verified')return deny('invariants-failed');
  // GM approval alone is insufficient: no independent CPU authority or atomic adapter.
  return deny('cpu-authority-and-atomic-settlement-unavailable');
 }
 return Object.freeze({reload,review,decide});
}
module.exports={create};

};
root.HLMPhase11MobileTradeReview=Object.freeze({create:require('./hlm-phase11-m1507j-guarded-trade-workflow').create});
})(typeof globalThis!=='undefined'?globalThis:this);
