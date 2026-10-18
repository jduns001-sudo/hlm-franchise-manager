/* Experimental pure season ledger. No browser storage, network or production writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonLedger=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function standings(state){if(!state||!state.universe||!Array.isArray(state.universe.teams)||!state.activity||!Array.isArray(state.activity.games))throw Error('Invalid isolated season');
const teams=new Map(state.universe.teams.map(t=>[String(t.id),{teamId:t.id,name:String(t.name||t.id),gp:0,w:0,l:0,otl:0,pts:0,gf:0,ga:0}]));
for(const g of state.activity.games){if(g.status!=='final')continue;const h=teams.get(String(g.homeTeamId)),a=teams.get(String(g.awayTeamId));if(!h||!a||h===a||!Number.isSafeInteger(g.homeGoals)||!Number.isSafeInteger(g.awayGoals)||g.homeGoals<0||g.awayGoals<0||g.homeGoals===g.awayGoals)throw Error('Invalid completed game');h.gp++;a.gp++;h.gf+=g.homeGoals;h.ga+=g.awayGoals;a.gf+=g.awayGoals;a.ga+=g.homeGoals;const winner=g.homeGoals>g.awayGoals?h:a,loser=winner===h?a:h;winner.w++;winner.pts+=2;if(g.overtime===true){loser.otl++;loser.pts++}else loser.l++;}
return Object.freeze([...teams.values()].sort((a,b)=>b.pts-a.pts||b.w-a.w||(b.gf-b.ga)-(a.gf-a.ga)||String(a.teamId).localeCompare(String(b.teamId))).map(t=>Object.freeze({...t})))}
function continuity(before,after){if(!before||!after)throw Error('Season states required');const ids=s=>s.universe.players.map(p=>String(p.id)+':'+String(p.teamId)).sort();if(JSON.stringify(ids(before))!==JSON.stringify(ids(after)))throw Error('Roster continuity violated');if(String(before.meta.controlledTeamId)!==String(after.meta.controlledTeamId))throw Error('Human GM control changed');return Object.freeze({rosterUnchanged:true,controlledTeamUnchanged:true,productionWrite:false,finalDecisionMaker:'human-gm'})}
return Object.freeze({standings,continuity});
});
