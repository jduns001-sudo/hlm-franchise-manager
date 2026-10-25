/* Mission 1608: real isolated workspace boundary, deliberately fail-closed.
 * Browser localStorage cannot provide an atomic cross-tab CAS and the repository
 * has no independently authenticated CPU receiving-team trust root.
 * Read-only evidence only, NEVER call settlement or mutate saved game state. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLM1608IsolatedSettlementBoundary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const ISOLATED='hlm-phase11-m1340-isolated-single-game-v1';
const PRODUCTION='hlm_front_office_v8';
function create(storage){if(!storage||typeof storage.getItem!=='function')throw Error('Isolated storage required');let baseline=storage.getItem(ISOLATED);
function blocked(code,extra){return Object.freeze({status:'blocked',code,saveKey:ISOLATED,atomicSettlementVerified:false,independentlyAuthenticated:false,gmApproved:false,saved:false,productionActivated:false,experimental:true,...extra})}
function inspect(){const raw=storage.getItem(ISOLATED);if(raw!==baseline)return blocked('stale-isolated-save');if(!raw)return blocked('missing-isolated-save');let state;try{state=JSON.parse(raw)}catch{return blocked('invalid-isolated-save')}if(!state||!Array.isArray(state.universe?.players)||!Array.isArray(state.activity?.games)||!state.meta?.controlledTeamId)return blocked('invalid-isolated-save');return blocked('atomic-storage-and-cpu-consent-not-integrated',{controlledTeamId:state.meta.controlledTeamId,playerCount:state.universe.players.length,scheduledGameIds:Object.freeze(state.activity.games.filter(g=>g.status==='scheduled').map(g=>String(g.id??g.gameId)))})}
function review(){return inspect()}function decide(action){if(!['approve','decline','cancel'].includes(action))throw Error('Explicit GM decision required');if(action!=='approve')return blocked(action);if(storage.getItem(ISOLATED)!==baseline)return blocked('stale-isolated-save');return blocked('atomic-storage-and-cpu-consent-not-integrated')}
function reload(){baseline=storage.getItem(ISOLATED);return inspect()}
return Object.freeze({inspect,review,decide,reload,key:ISOLATED,productionKey:PRODUCTION})}
return Object.freeze({create,ISOLATED,PRODUCTION})});