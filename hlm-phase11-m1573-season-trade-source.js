/* Read-only trade planning from the playable season's own saved GameState. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonTradeSource=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(readState){
 if(typeof readState!=='function')throw Error('Saved-season reader required');
 let baseline=null;
 const name=(value,id)=>typeof value==='string'&&value.trim()?value.trim():String(id);
 function inspect(){
  const state=readState();
  if(!state)return null;
  const players=state.universe?.players,teams=state.universe?.teams,contracts=state.assets?.contracts;
  if(!Array.isArray(players)||!Array.isArray(teams)||!Array.isArray(contracts)||
   players.some(p=>!p||p.id==null)||teams.some(t=>!t||t.id==null)||
   new Set(players.map(p=>String(p.id))).size!==players.length||new Set(teams.map(t=>String(t.id))).size!==teams.length)
   throw Error('Saved-season player or team identities are unavailable or ambiguous');
  const teamMap=new Map(teams.map(t=>[String(t.id),t]));
  if(!teamMap.has(String(state.meta?.controlledTeamId)))throw Error('Saved controlled team unavailable');
  return {state,players,teamMap,contracts};
 }
 function choices(){
  baseline=null;const source=inspect();
  if(!source)return {ready:false,outgoing:[],incoming:[],saved:false,settlementAuthorized:false};
  const {state,players,teamMap}=source,owner=String(state.meta.controlledTeamId),outgoing=[],incoming=[];
  for(const p of players){const team=teamMap.get(String(p.teamId));if(!team||p.retired===true||p.status===-1||p.status==='retired')continue;
   const item={id:String(p.id),name:name(p.name,p.id),teamId:String(team.id),teamName:name(team.name,team.id)};
   (item.teamId===owner?outgoing:incoming).push(item);
  }
  const sort=(a,b)=>a.teamName.localeCompare(b.teamName)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
  outgoing.sort(sort);incoming.sort(sort);baseline=JSON.stringify(state);
  return {ready:true,controlledTeamId:owner,teamName:name(teamMap.get(owner).name,owner),outgoing,incoming,saved:false,settlementAuthorized:false};
 }
 function review(input={}){
  const source=inspect();
  if(!source||baseline===null)throw Error('Refresh saved-season players before review');
  if(JSON.stringify(source.state)!==baseline)throw Error('Saved season changed. Refresh players and review again');
  const ids=[input.outgoingPlayerId,input.incomingPlayerId];
  if(ids.some(id=>typeof id!=='string'||!id.trim())||ids[0]===ids[1])throw Error('Choose two different saved-season players');
  const selected=ids.map(id=>source.players.find(p=>String(p.id)===id));
  const owner=String(source.state.meta.controlledTeamId);
  if(selected.some(p=>!p||!source.teamMap.has(String(p.teamId))||p.retired===true||p.status===-1||p.status==='retired')||
   String(selected[0].teamId)!==owner||String(selected[1].teamId)===owner)throw Error('Selected players no longer match the saved team ownership');
  const players=selected.map(p=>{
   const active=source.contracts.filter(c=>c&&String(c.playerId)===String(p.id)&&c.status==='active');
   const matched=active.length===1&&String(active[0].teamId)===String(p.teamId);
   const team=source.teamMap.get(String(p.teamId)),aav=matched?active[0].aav:null;
   return {id:String(p.id),name:name(p.name,p.id),teamId:String(p.teamId),teamName:name(team.name,team.id),
    contractStatus:matched?'source-active-contract':active.length>1?'ambiguous-active-contract':'active-contract-unavailable',
    aav:matched&&typeof aav==='number'&&Number.isFinite(aav)&&aav>=0?aav:null};
  });
  return {source:'current-saved-isolated-season',players,saved:false,settlementAuthorized:false,cpuConsentAuthenticated:false,
   message:'Player source review only. Trade approval and settlement are not connected to this season.'};
 }

 // This is evidence inspection, not a settlement authorization. The source
 // is the currently persisted isolated season, never a constructed trade fixture.
 function preflight(input={}){
  const reviewed=review(input),source=inspect(),reasons=[];
  const affected=reviewed.players.map(player=>{
   const teamId=player.teamId;
   const roster=source.players.filter(p=>String(p.teamId)===teamId&&p.retired!==true&&p.status!==-1&&p.status!=='retired');
   const matched=new Map();let missing=0,ambiguous=0,invalid=0,payroll=0;
   for(const p of roster){
    const records=source.contracts.filter(c=>c&&c.status==='active'&&String(c.playerId)===String(p.id));
    if(records.length===0){missing++;continue}
    if(records.length!==1){ambiguous++;continue}
    const c=records[0];
    if(String(c.teamId)!==teamId||typeof c.aav!=='number'||!Number.isFinite(c.aav)||c.aav<0){invalid++;continue}
    matched.set(String(p.id),c);payroll+=c.aav;
   }
   if(missing)reasons.push(player.teamName+': '+missing+' roster player(s) missing unique active contract evidence');
   if(ambiguous)reasons.push(player.teamName+': '+ambiguous+' ambiguous active contract record(s)');
   if(invalid)reasons.push(player.teamName+': '+invalid+' invalid active contract ownership or cap charge(s)');
   const orphans=source.contracts.filter(c=>c&&c.status==='active'&&String(c.teamId)===teamId&&
    !roster.some(p=>String(p.id)===String(c.playerId)));
   if(orphans.length)reasons.push(player.teamName+': '+orphans.length+' active contract(s) without matching current roster ownership');
   const cap=source.state.finances?.teamCapLimits?.[teamId];
   if(typeof cap!=='number'||!Number.isFinite(cap)||cap<0)
    reasons.push(player.teamName+': source team cap limit unavailable');
   const limit=source.state.extensions?.tradeRosterLimits?.[teamId];
   if(!Number.isSafeInteger(limit)||limit<0)
    reasons.push(player.teamName+': source roster limit unavailable');
   else if(roster.length>limit)reasons.push(player.teamName+': current roster exceeds source limit');
   return {teamId,teamName:player.teamName,rosterCount:roster.length,capLimit:typeof cap==='number'&&Number.isFinite(cap)&&cap>=0?cap:null,
    beforePayroll:missing||ambiguous||invalid||orphans.length?null:payroll,matched};
  });
  const contracts=reviewed.players.map((p,i)=>affected[i].matched.get(p.id));
  for(let i=0;i<contracts.length;i++){
   if(!contracts[i])reasons.push(reviewed.players[i].name+': selected player has no valid active contract evidence');
   else if(contracts[i].tradePermission!=='allowed')
    reasons.push(reviewed.players[i].name+': source trade permission is not explicitly allowed');
  }
  const [outgoing,incoming]=contracts,readyToCalculate=affected.every(t=>t.beforePayroll!==null&&t.capLimit!==null)&&
   outgoing!==undefined&&incoming!==undefined;
  const financial=affected.map((team,i)=>{
   const projectedPayroll=readyToCalculate?team.beforePayroll-(i===0?outgoing.aav:incoming.aav)+
    (i===0?incoming.aav:outgoing.aav):null;
   if(projectedPayroll!==null&&projectedPayroll>team.capLimit)
    reasons.push(team.teamName+': projected payroll exceeds source cap');
   return Object.freeze({teamId:team.teamId,teamName:team.teamName,beforePayroll:team.beforePayroll,
    projectedPayroll,capLimit:team.capLimit,rosterCount:team.rosterCount});
  });
  return Object.freeze({source:'current-saved-isolated-season',saved:false,settlementAuthorized:false,
   cpuConsentAuthenticated:false,sourceDataComplete:reasons.length===0,
   blockers:Object.freeze(reasons),financial:Object.freeze(financial),
   message:'Read-only financial and roster preflight only. CPU consent, league restrictions and real-season settlement are not authenticated or enabled.'});
 }
 return Object.freeze({choices,review,preflight});
}
return Object.freeze({create});
});
