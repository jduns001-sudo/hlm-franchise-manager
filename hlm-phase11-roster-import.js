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
