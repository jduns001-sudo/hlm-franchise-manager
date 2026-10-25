/* Mission 1586: read-only GM multi-season decision readiness. No writes or approvals. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMMultiseasonGMReadiness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const frozen=o=>Object.freeze(o);
function describe(state){if(!state||!Array.isArray(state.activity?.games))return frozen({kind:'unavailable',saved:false,action:null});
const seasonId=String(state.extensions?.phase10CurrentSeasonId||'');
const history=Array.isArray(state.history?.seasons)?state.history.seasons:[];
const scheduled=state.activity.games.filter(g=>g&&g.status==='scheduled');
const archivedPrior=history.filter(s=>s&&String(s.seasonId)!==seasonId);
if(!seasonId)return frozen({kind:'unavailable',saved:false,action:null});
if(state.extensions?.phase10Playoffs?.status==='complete'&&history.some(s=>s&&String(s.seasonId)===seasonId)&&scheduled.length===0)
return frozen({kind:'offseason-review',seasonId,action:'offseason-review',saved:false,requiresExplicitGMApproval:true});
if(!archivedPrior.length||history.some(s=>s&&String(s.seasonId)===seasonId)||!scheduled.length)
return frozen({kind:'unavailable',saved:false,action:null});
const sorted=scheduled.filter(g=>typeof g.id==='string'||typeof g.gameId==='string').slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.id||a.gameId).localeCompare(String(b.id||b.gameId)));
if(!sorted.length)return frozen({kind:'unavailable',saved:false,action:null});
const next=sorted[0];return frozen({kind:'scheduled-day-review',seasonId,gameId:String(next.id||next.gameId),date:String(next.date||''),scheduledGames:scheduled.length,archivedSeasons:archivedPrior.length,action:'day-review',saved:false,requiresExplicitGMApproval:true});}
function create(readState){if(typeof readState!=='function')throw Error('Saved GameState reader required');let reviewed=null;return frozen({inspect(){reviewed=null;const state=readState(),result=describe(state);if(result.action)reviewed={snapshot:JSON.stringify(state),result};return result},open(){if(!reviewed)throw Error('Refresh GM readiness review');const prior=reviewed;reviewed=null;const current=readState();if(!current||JSON.stringify(current)!==prior.snapshot||JSON.stringify(describe(current))!==JSON.stringify(prior.result))throw Error('Stale saved-season readiness; refresh review');return frozen({target:prior.result.action,kind:prior.result.kind,saved:false,requiresExplicitGMApproval:true})},decline(){reviewed=null;return frozen({declined:true,saved:false})}});}
return frozen({describe,create});});
