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
 let lineup={};if(state.extensions?.phase11LineupPlan!==undefined){try{const validator=typeof module==='object'&&module.exports?require('./hlm-phase11-lineup-plan'):globalThis.HLMLineupPlan;if(!validator)throw Error('Lineup validator unavailable');const info=validator.inspect(state,state.extensions.phase11LineupPlan);if(!info.eligible)warnings.push(...info.issues);lineup={lineupPlan:info.plan,lines:info.eligible?'Recorded starting-unit plan (not actual participation)':'Recorded starting-unit plan — currently ineligible; review required',depth:'Recorded depth plan'};}catch(e){warnings.push('Saved lineup unavailable: '+e.message)}}
 return {status:'ready',team:text(team[0].name),teamId:owner,season:typeof state.extensions?.phase10CurrentSeasonId==='string'&&state.extensions.phase10CurrentSeasonId.trim()?state.extensions.phase10CurrentSeasonId:'Not recorded',players:sort(players),plans,warnings,lines:'Unavailable',depth:'Unavailable',...lineup};
}
// Standings consume only calculated snapshot rows, never lineup or storage authority.
function standingsView(snapshot){
 if(snapshot?.loaded!==true)return {status:'empty',rows:[],message:'No isolated franchise loaded. Load a franchise to view standings.'};
 const owner=id(snapshot.teamId),source=snapshot.standings;
 if(owner===null||!Array.isArray(source))return {status:'unavailable',rows:[],message:'Standings unavailable in this franchise snapshot.'};
 const counts=new Map();for(const row of source){const key=id(row?.teamId);if(key!==null)counts.set(key,(counts.get(key)||0)+1);}
 const rows=[];let omitted=0;
 for(const row of source){
  const key=id(row?.teamId),metrics=['gp','w','l','otl','points'];
  if(!row||typeof row!=='object'||Array.isArray(row)||key===null||counts.get(key)!==1||metrics.some(k=>!Number.isSafeInteger(row[k])||row[k]<0)){omitted++;continue;}
  rows.push({teamId:key,teamName:typeof row.teamName==='string'&&row.teamName.trim()?row.teamName:'Team ID '+key,gp:row.gp,w:row.w,l:row.l,otl:row.otl,points:row.points,controlled:key===owner});
 }
 const warnings=[];if(omitted)warnings.push(omitted+' malformed or ambiguous standing rows omitted.');
 if(rows.length&&!rows.some(row=>row.controlled))warnings.push('Controlled franchise is not present in the available standings.');
 return {status:rows.length?'ready':'unavailable',rows,message:(rows.length?rows.length+' teams.':'No valid standings rows available.')+(warnings.length?' '+warnings.join(' '):'')};
}
// Read-only overview of the existing snapshot, never a schedule or result generator.
function seasonView(snapshot){
 if(snapshot?.loaded!==true)return {message:'No isolated franchise loaded. Create or load one in More.',rows:[]};
 const value=x=>typeof x==='string'&&x.trim()?x:'Not recorded';
 const count=x=>Number.isSafeInteger(x)&&x>=0?String(x):'Unavailable';
 const game=snapshot.nextGame;
 return {message:'Experimental isolated season. Review and approval remain separate GM decisions.',rows:[
  ['Franchise',value(snapshot.teamName)],['Current date',value(snapshot.date)],
  ['Completed team games',count(snapshot.ownerFinals)],['Remaining team games',count(snapshot.ownerRemaining)],
  ['Next team game',game&&typeof game==='object'?value(game.date)+' | '+value(game.home)+' vs '+value(game.away):'No upcoming team game recorded'],
  ['Latest team result',value(snapshot.lastResult)],['Recent form',value(snapshot.form)]
 ]};
}
function sort(players,key='name',direction='asc'){
 const dir=direction==='desc'?-1:1;return players.map(p=>({...p})).sort((a,b)=>{if(key==='rating'){if(a.rating===null||b.rating===null){if(a.rating===b.rating)return compare(a.id,b.id);return a.rating===null?1:-1}return dir*(a.rating-b.rating)||compare(a.id,b.id)}return dir*compare(text(a[key]).toLowerCase(),text(b[key]).toLowerCase())||compare(a.id,b.id)});
}
function filter(players,{query='',position='all'}={}){const q=String(query).toLowerCase();return players.filter(p=>(position==='all'||p.position===position)&&(!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q))).map(p=>({...p}));}
function rating(value){return value===null||value===undefined?'Unknown':text(value);}
// Pure review of the exact proposed plan. Never returns commands or changes assignments.
function lineupReview(state,proposed){
 const validator=typeof module==='object'&&module.exports?require('./hlm-phase11-lineup-plan'):globalThis.HLMLineupPlan;
 if(!validator)throw Error('Lineup validator unavailable');
 validator.validate(state,proposed);
 const current=state.extensions?.phase11LineupPlan;
 const saved=current===undefined?null:validator.inspect(state,current);
 const plan=JSON.parse(JSON.stringify(proposed));
 function reference(value){
  if(value===null)return {id:null,name:null,label:'Open'};
  const matches=state.universe.players.filter(p=>String(p.id)===String(value));
  const p=matches.length===1?matches[0]:null;
  const name=p&&typeof p.name==='string'&&p.name.trim()?p.name:p?'Name unavailable':'Missing player';
  const position=p&&typeof p.position==='string'&&p.position.trim()?p.position:'Unknown';
  return {id:value,name,position,label:name+' [ID: '+String(value)+'] | saved position: '+position};
 }
 const same=(a,b)=>a===null||b===null?a===b:String(a)===String(b);
 const slots=Object.keys(validator.slots).map(slot=>{
  const before=saved?reference(saved.plan.slots[slot]):null,after=reference(plan.slots[slot]);
  const change=!saved?'initial':same(before.id,after.id)?'unchanged':before.id===null?'added':after.id===null?'removed':'reassigned';
  return {slot,before,after,change};
 });
 const depth=validator.groups.map(group=>{
  const before=saved?saved.plan.depth[group].map(reference):null,after=plan.depth[group].map(reference);
  const added=after.filter(p=>!before||!before.some(q=>same(p.id,q.id)));
  const removed=(before||[]).filter(p=>!after.some(q=>same(p.id,q.id)));
  const changed=!saved||JSON.stringify(before.map(p=>String(p.id)))!==JSON.stringify(after.map(p=>String(p.id)));
  return {group,before,after,added,removed,changed};
 });
 const warnings=saved?[...saved.issues]:[];
 const lines=['Lines & Depth change review','Starting-unit and depth planning only. Not participation approval or actual participation.',saved?'Currently saved plan versus proposed replacement':'Currently saved plan: Unavailable — no saved plan'];
 for(const row of slots)lines.push('',row.slot+' slot — '+row.change,'Saved: '+(row.before?row.before.label:'Unavailable — no saved plan'),'Proposed: '+row.after.label);
 const order=rows=>rows.length?rows.map((p,i)=>(i+1)+'. '+p.label).join('\n'):'Empty';
 for(const row of depth){lines.push('',row.group+' depth — '+(row.changed?'changed':'unchanged'),'Saved order:\n'+(row.before?order(row.before):'Unavailable — no saved plan'),'Proposed order:\n'+order(row.after));if(row.added.length)lines.push('Added: '+row.added.map(p=>p.label).join('; '));if(row.removed.length)lines.push('Removed: '+row.removed.map(p=>p.label).join('; '));}
 if(warnings.length)lines.push('','Warnings about currently saved assignments:',...warnings);
 return {savedPresent:!!saved,plan,slots,depth,warnings,text:lines.join('\n')};
}
return Object.freeze({project,standingsView,seasonView,sort,filter,escape,rating,lineupReview});
});
