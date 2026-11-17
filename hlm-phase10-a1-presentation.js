/* Pure saved-state presentation. No command, source-fetch or persistence capability. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMPhase10A1Presentation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const text=x=>typeof x==='string'||typeof x==='number'?String(x):'Unavailable';
const id=x=>typeof x==='string'&&x.trim()===x&&x.length>0?x:typeof x==='number'&&Number.isSafeInteger(x)?String(x):null;
const compare=(a,b)=>a<b?-1:a>b?1:0;
function escape(x){return text(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function project(state){
 if(!state)return {status:'empty',season:'Not recorded',team:'Unavailable',players:[],plans:[],warnings:[],lines:'Unavailable',depth:'Unavailable'};
 const owner=id(state.meta?.controlledTeamId),teams=Array.isArray(state.universe?.teams)?state.universe.teams:[],all=Array.isArray(state.universe?.players)?state.universe.players:[],team=teams.filter(t=>t&&typeof t==='object'&&id(t.id)===owner),warnings=[];
 if(owner===null||team.length!==1)return {...project(null),status:'unavailable',warnings:['Controlled team identity unavailable']};
 const owned=all.filter(p=>p&&typeof p==='object'&&id(p.teamId)===owner),seen=new Set(),players=[];
 for(const p of owned){const key=id(p.id);if(key===null){warnings.push('Player with missing permanent ID omitted');continue}if(seen.has(key)){warnings.push('Duplicate player ID: '+key);continue}seen.add(key);const value=p.overall??p.ovr;players.push({id:key,name:text(p.name),teamId:owner,team:text(team[0].name),position:typeof p.position==='string'&&p.position.trim()?p.position:'Unknown',rating:typeof value==='number'&&Number.isFinite(value)?value:null});}
 const plans=[];
 for(const [key,label] of [['phase11GmApprovedSkaters','Approved skater participation plan'],['phase11GmGameDaySkaterApproval','Approved game-day participation plan']]){
  const plan=state.extensions?.[key];if(plan===undefined)continue;
  if(!plan||id(plan.teamId)!==owner||!Array.isArray(plan.playerIds)){warnings.push('Invalid '+label);continue}
  const selected=new Set();const references=plan.playerIds.map(value=>{const key=id(value),matches=owned.filter(p=>id(p.id)===key),duplicate=selected.has(key);selected.add(key);return {id:key??'Unknown',name:matches.length===1?text(matches[0].name):'Unavailable',valid:key!==null&&matches.length===1&&!duplicate,warning:duplicate?'Duplicate reference':matches.length!==1?'Missing or ambiguous owned player':''}});
  plans.push({label,gameId:plan.gameId===undefined?'Not recorded':text(plan.gameId),references});
 }
 return {status:'ready',team:text(team[0].name),teamId:owner,season:typeof state.extensions?.phase10CurrentSeasonId==='string'&&state.extensions.phase10CurrentSeasonId.trim()?state.extensions.phase10CurrentSeasonId:'Not recorded',players:sort(players),plans,warnings,lines:'Unavailable',depth:'Unavailable'};
}
function sort(players,key='name',direction='asc'){
 const dir=direction==='desc'?-1:1;return players.map(p=>({...p})).sort((a,b)=>{if(key==='rating'){if(a.rating===null||b.rating===null){if(a.rating===b.rating)return compare(a.id,b.id);return a.rating===null?1:-1}return dir*(a.rating-b.rating)||compare(a.id,b.id)}return dir*compare(text(a[key]).toLowerCase(),text(b[key]).toLowerCase())||compare(a.id,b.id)});
}
function filter(players,{query='',position='all'}={}){const q=String(query).toLowerCase();return players.filter(p=>(position==='all'||p.position===position)&&(!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q))).map(p=>({...p}));}
function rating(value){return value===null||value===undefined?'Unknown':text(value);}
return Object.freeze({project,sort,filter,escape,rating});
});
