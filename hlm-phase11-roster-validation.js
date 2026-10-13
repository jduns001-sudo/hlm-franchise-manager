'use strict';
function validateImportedRoster(state,{maxTeams=1000,maxPlayers=100000}={}){
 const errors=[],warnings=[];
 const u=state&&state.universe;
 if(!u||!Array.isArray(u.teams)||!Array.isArray(u.players))return {valid:false,errors:['Missing universe teams or players'],warnings:[],summary:null};
 if(u.teams.length>maxTeams)errors.push('Team count exceeds preview safety limit');
 if(u.players.length>maxPlayers)errors.push('Player count exceeds preview safety limit');
 const teamIds=new Set(),playerIds=new Set();
 for(const t of u.teams){if(!t||!(typeof t.id==='string'||typeof t.id==='number')||String(t.id).trim()==='')errors.push('Team missing valid id');else if(teamIds.has(String(t.id)))errors.push('Duplicate team id: '+t.id);else teamIds.add(String(t.id))}
 for(const p of u.players){if(!p||!(typeof p.id==='string'||typeof p.id==='number')||String(p.id).trim()===''){errors.push('Player missing valid id');continue}if(playerIds.has(String(p.id)))errors.push('Duplicate player id: '+p.id);else playerIds.add(String(p.id));if(p.teamId!==null&&p.teamId!==undefined&&String(p.teamId)!==''&&!teamIds.has(String(p.teamId)))warnings.push('Player '+p.id+' references unknown team '+p.teamId)}
 return {valid:errors.length===0,errors,warnings,summary:{teams:u.teams.length,players:u.players.length}};
}
if(typeof module!=='undefined'&&module.exports)module.exports={validateImportedRoster};
if(typeof window!=='undefined')window.HLMPhase11RosterValidation={validateImportedRoster};
