/* Mission 1507T: actual 1507Q engine in browser; WebCrypto SHA-256 parity. Read-only. */
(function(root){'use strict';
const factories=Object.create(null),cache=Object.create(null);
let expectedDigest=null;
function require(id){const key=id.replace(/^\.\//,'').replace(/\.js$/,'');if(key==='node:crypto')return {createHash(algorithm){if(algorithm!=='sha256')throw Error('Unsupported digest');return {update(value){this.value=value;return this},digest(format){if(format!=='hex'||expectedDigest===null)throw Error('Digest unavailable');return expectedDigest}}}};if(!factories[key])throw Error('Unknown CPU module '+key);if(!cache[key]){const module={exports:{}};cache[key]=module;factories[key](module,module.exports,require)}return cache[key].exports}
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
factories["hlm-phase11-m1507o-cpu-decision-foundation"]=function(module,exports,require){
'use strict';
/* Mission 1507O: deterministic receiving-team decision recommendation.
 * A CPU recommendation is never an authenticated decision or consent.
 * No storage, mutations, settlement or caller-supplied authority overrides.
 */
const {evaluate}=require('./hlm-phase11-m1507k-cpu-trade-policy');
function review(state,input){
 const valuation=evaluate(state,input);
 const result=(status,reason)=>Object.freeze({
  status,reason,valuation,receivingTeamRecommendation:status==='cpu-review-recommends-accept'?'accept':'decline',
  independentlyAuthenticated:false,authenticatedCpuConsent:false,
  humanGmApprovalRequired:true,settlementAuthorized:false,saved:false,experimental:true
 });
 if(valuation.status!=='cpu-trade-evaluation-preview')
  return result('cpu-review-blocked',valuation.code||'source-review-unavailable');
 if(valuation.recommendation==='favorable-for-receiving-team')
  return result('cpu-review-recommends-accept','receiving-team-overall-improves');
 if(valuation.recommendation==='unfavorable-for-receiving-team')
  return result('cpu-review-recommends-decline','receiving-team-overall-declines');
 return result('cpu-review-recommends-decline','even-value-requires-independent-authority');
}
module.exports={review};

};
factories["hlm-phase11-m1507p-trade-authority-readiness"]=function(module,exports,require){
'use strict';
/* Mission 1507P: immutable proposal identity and authority readiness, read-only.
 * A digest binds the exact source state revision and canonical trade proposal.
 * It does NOT authenticate a CPU or GM, establish a trusted replay ledger,
 * or authorize settlement. No user-provided verifier is accepted.
 */
const crypto=require('node:crypto');
function makeIdentity(state,input,revision){
 if(typeof revision!=='string'||!revision||revision.length>256)throw Error('Revision required');
 if(!state||!input||!state.meta||!state.universe)throw Error('Source required');
 const proposal=Object.freeze({controlledTeamId:String(state.meta.controlledTeamId),
  outgoingPlayerId:String(input.outgoingPlayerId),incomingPlayerId:String(input.incomingPlayerId)});
 const digest=crypto.createHash('sha256').update(JSON.stringify({schema:'hlm-m1507p-preview-v1',revision,proposal,source:state})).digest('hex');
 return Object.freeze({revision,digest,proposal});
}
const {review}=require('./hlm-phase11-m1507o-cpu-decision-foundation');
function assess(state,input,revision,receipt,options){
 const deny=(code,identity=null,cpu=null)=>Object.freeze({
  status:'trade-authority-not-ready',code,
  proposalDigest:identity?.digest||null,stateRevision:identity?.revision||null,
  cpuRecommendation:cpu?.receivingTeamRecommendation||null,
  independentlyAuthenticated:false,gmApproved:false,
  replayProtected:false,settlementAuthorized:false,atomicSettlementVerified:false,
  saved:false,experimental:true
 });
 if(options?.cancelled===true||options?.declined===true)return deny('gm-declined-or-cancelled');
 let identity;
 try{identity=makeIdentity(state,input,revision)}catch{return deny('invalid-source-or-revision')}
 const cpu=review(state,input);
 if(cpu.status==='cpu-review-blocked')return deny('cpu-source-review-blocked',identity,cpu);
 if(cpu.receivingTeamRecommendation!=='accept')return deny('cpu-recommends-decline',identity,cpu);
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))
  return deny('independent-cpu-proof-missing',identity,cpu);
 if(receipt.proposalDigest!==identity.digest||receipt.stateRevision!==identity.revision)
  return deny('stale-or-mismatched-proof',identity,cpu);
 // A matching digest or nonce is not a trusted signature or a replay ledger.
 // Neither caller-supplied "trusted" flags nor consent declarations grant authority.
 return deny('trusted-cpu-authority-and-replay-ledger-unavailable',identity,cpu);
}
module.exports={assess,identity:makeIdentity};

};
factories["hlm-phase11-m1507q-cpu-decision-engine"]=function(module,exports,require){
'use strict';
/* Mission 1507Q: isolated deterministic CPU decision engine.
 * The engine owns its policy decision, but has no independent trust root or
 * durable replay ledger. It NEVER represents consent as authenticated and
 * cannot settle trades or write storage.
 */
const {assess,identity}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const {review}=require('./hlm-phase11-m1507o-cpu-decision-foundation');
function create(){
 const seen=new Set();
 function decide(state,input,revision,options){
  const blocked=(code,digest=null)=>Object.freeze({
   status:'cpu-trade-decision-blocked',code,proposalDigest:digest,
   decision:'blocked',independentlyAuthenticated:false,
   authenticatedCpuConsent:false,replayProtected:false,
   settlementAuthorized:false,saved:false,experimental:true
  });
  if(options?.cancelled===true||options?.declined===true)return blocked('gm-declined-or-cancelled');
  let id;
  try{id=identity(state,input,revision)}catch{return blocked('invalid-proposal')}
  if(seen.has(id.digest))return blocked('duplicate-proposal-in-session',id.digest);
  const readiness=assess(state,input,revision);
  const recommendation=review(state,input);
  if(readiness.code==='cpu-source-review-blocked'||recommendation.status==='cpu-review-blocked')
   return blocked('source-eligibility-failed',id.digest);
  // Even a favorable recommendation is not independently authenticated consent.
  // Record only within this engine instance; not a durable replay ledger.
  seen.add(id.digest);
  const decision=recommendation.receivingTeamRecommendation==='accept'?'accept':'decline';
  return Object.freeze({
   status:'cpu-trade-decision-preview',decision,
   proposalDigest:id.digest,stateRevision:id.revision,
   source:'deterministic-isolated-cpu-policy',humanGmApprovalRequired:true,
   independentlyAuthenticated:false,authenticatedCpuConsent:false,
   replayProtected:false,settlementAuthorized:false,saved:false,experimental:true
  });
 }
 return Object.freeze({decide});
}
module.exports={create};

};
const engine=require('./hlm-phase11-m1507q-cpu-decision-engine').create();
async function decide(state,input,revision,options){
 if(options?.cancelled===true||options?.declined===true)return engine.decide(state,input,revision,options);
 if(typeof revision!=='string'||!revision||revision.length>256)return engine.decide(state,input,revision,options);
 if(!state||!input||!state.meta||!state.universe)return engine.decide(state,input,revision,options);
 const proposal={controlledTeamId:String(state.meta.controlledTeamId),outgoingPlayerId:String(input.outgoingPlayerId),incomingPlayerId:String(input.incomingPlayerId)};
 const payload=JSON.stringify({schema:'hlm-m1507p-preview-v1',revision,proposal,source:state});
 const bytes=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
 expectedDigest=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 try{return engine.decide(state,input,revision,options)}finally{expectedDigest=null}
}
root.HLMPhase11BrowserCpuDecision=Object.freeze({decide});
})(typeof globalThis!=='undefined'?globalThis:this);
