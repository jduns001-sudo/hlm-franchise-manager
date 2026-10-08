(function(root){
'use strict';
// 416: validate franchise file; 417: team roster summary;
// 418: contract and pick ownership; 419: missing-team diagnostic;
// 420: immutable read-only insights.
function analyzeFranchise(state){
 if(!state||state.schemaVersion!==1||!state.meta||!state.universe||!Array.isArray(state.universe.teams)||!Array.isArray(state.universe.players)||!state.assets||!Array.isArray(state.assets.contracts)||!Array.isArray(state.assets.draftPicks))throw new Error('Invalid GameState v1');
 const id=state.meta.controlledTeamId;
 const team=state.universe.teams.find(t=>String(t.id)===String(id));
 const matches=(record,keys)=>keys.some(k=>record[k]!=null&&String(record[k])===String(id));
 const roster=state.universe.players.filter(p=>matches(p,['teamId','currentTeamId','team']));
 const contracts=state.assets.contracts.filter(c=>matches(c,['teamId','currentTeamId']));
 const picks=state.assets.draftPicks.filter(p=>matches(p,['ownerTeamId','currentOwnerTeamId']));
 const warnings=[];
 if(id==null)warnings.push('No controlled team selected');
 else if(!team)warnings.push('Controlled team not found in teams');
 if(roster.length===0)warnings.push('No roster matches known team ID fields');
 return Object.freeze({kind:'cpu-franchise-insights',version:1,teamId:id??null,teamName:team?String(team.name??team.id):null,
  rosterCount:roster.length,contractCount:contracts.length,draftPickCount:picks.length,
  warnings:Object.freeze(warnings),fieldMapping:'best-effort',advisoryOnly:true,executionEnabled:false,persistencePerformed:false});
}
if(typeof module!=='undefined'&&module.exports)module.exports={analyzeFranchise};
root.HFMCPUFranchiseInsights=Object.freeze({analyzeFranchise});
})(typeof globalThis!=='undefined'?globalThis:this);
