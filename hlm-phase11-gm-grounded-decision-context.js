/* Mission 1233: grounded, non-executing GM context from isolated roster staging. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-decision-preparation'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMGroundedDecisionContext=api;})(typeof globalThis!=='undefined'?globalThis:this,function(decisions){
'use strict';
function requireId(value,label){if(value===null||value===undefined||String(value).trim()==='')throw Error('Missing '+label);return String(value);}
function summarize(queue,state,focus,approved){
 if(approved!==true)throw Error('Explicit human GM approval required');
 if(!state||state.schemaVersion!==1||!state.meta||!state.universe||!Array.isArray(state.universe.teams)||!Array.isArray(state.universe.players)||!state.extensions||!state.extensions.staging||state.extensions.staging.source!=='front-office'||state.extensions.staging.productionActivationAllowed!==false||!String(state.meta.saveId||'').startsWith('isolated-stage:'))throw Error('Validated isolated Front Office candidate required');
 const api=decisions||(typeof globalThis!=='undefined'&&globalThis.HLMGMDecisionPreparation),base=api.prepare(queue,focus,true);
 if(String(base.controlledTeamId)!==String(state.meta.controlledTeamId))throw Error('Controlled team mismatch');
 const teamIds=new Set(),playerIds=new Set();
 for(const t of state.universe.teams){const id=requireId(t&&t.id,'team ID');if(teamIds.has(id))throw Error('Duplicate team ID');teamIds.add(id);}
 if(!teamIds.has(String(base.controlledTeamId)))throw Error('Controlled team missing');
 const roster=[];
 for(const p of state.universe.players){const id=requireId(p&&p.id,'player ID');if(playerIds.has(id))throw Error('Duplicate player ID');playerIds.add(id);if(p.teamId!=null&&!teamIds.has(String(p.teamId)))throw Error('Unknown player team');if(String(p.teamId)===String(base.controlledTeamId))roster.push({id:p.id,name:typeof p.name==='string'&&p.name.trim()?p.name:null,position:typeof p.position==='string'&&p.position.trim()?p.position:null,overall:Number.isFinite(p.overall)?p.overall:null});}
 roster.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const positions={};for(const p of roster){const key=p.position||'unknown';positions[key]=(positions[key]||0)+1;}
 const questions=base.considerations.map(c=>({...c,question:focus==='roster'?'Review the '+roster.length+' currently staged roster records before considering any roster changes.':focus==='lineup'?'Review staged position coverage before considering any lineup changes.':'Review the missing opponent evidence before requesting additional scouting.',rosterContextAvailable:focus!=='scouting',scoutingEvidenceStatus:'insufficient-preview-evidence',executionAllowed:false}));
 return {...base,kind:'experimental-gm-grounded-decision-context',source:'isolated-front-office-staging',rosterContext:{controlledTeamId:state.meta.controlledTeamId,playerCount:roster.length,positionCounts:positions,players:roster,missingNameCount:roster.filter(p=>p.name===null).length,missingPositionCount:roster.filter(p=>p.position===null).length},considerations:questions,limitations:[...base.limitations,'Player names, positions and overall are copied only from validated staged records; missing fields remain unknown','Position counts are descriptive, not lineup recommendations or verified roster eligibility','Opponent evidence does not establish a scouting target or action'],productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,gmApprovalStillRequired:true,finalDecisionMaker:'human-gm'};
}
return {summarize};
});
