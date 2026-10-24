/* Mission 1577: read-only saved-season contract evidence coverage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMContractEvidenceBoard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(readState){
 if(typeof readState!=='function')throw Error('Saved-season reader required');
 let baseline=null;
 function inspect(){
  const state=readState();if(!state)return {ready:false,saved:false,settlementAuthorized:false,teams:[]};
  const players=state.universe?.players,teams=state.universe?.teams,contracts=state.assets?.contracts;
  if(!Array.isArray(players)||!Array.isArray(teams)||!Array.isArray(contracts))throw Error('Saved universe or contract data unavailable');
  if(new Set(players.map(p=>String(p?.id))).size!==players.length||
     new Set(teams.map(t=>String(t?.id))).size!==teams.length)throw Error('Duplicate saved identities');
  const output=[];
  for(const team of teams){
   const id=String(team.id),roster=players.filter(p=>String(p.teamId)===id&&p.retired!==true&&p.status!==-1&&p.status!=='retired');
   let matched=0,missing=0,ambiguous=0,invalid=0,unknownPermission=0,restricted=0,payroll=0;
   for(const p of roster){
    const c=contracts.filter(x=>x&&x.status==='active'&&String(x.playerId)===String(p.id));
    if(!c.length){missing++;continue}
    if(c.length!==1){ambiguous++;continue}
    if(String(c[0].teamId)!==id||typeof c[0].aav!=='number'||!Number.isFinite(c[0].aav)||c[0].aav<0){invalid++;continue}
    matched++;payroll+=c[0].aav;
    if(c[0].tradePermission==='restricted')restricted++;
    else if(c[0].tradePermission!=='allowed')unknownPermission++;
   }
   const orphans=contracts.filter(c=>c&&c.status==='active'&&String(c.teamId)===id&&!roster.some(p=>String(p.id)===String(c.playerId))).length;
   const cap=state.finances?.teamCapLimits?.[id],limit=state.extensions?.tradeRosterLimits?.[id];
   const validCap=typeof cap==='number'&&Number.isFinite(cap)&&cap>=0;
   const validLimit=Number.isSafeInteger(limit)&&limit>=0;
   const blockers=[];
   if(missing)blockers.push(missing+' missing active contracts');
   if(ambiguous)blockers.push(ambiguous+' duplicate active contracts');
   if(invalid)blockers.push(invalid+' invalid contract values or ownership');
   if(orphans)blockers.push(orphans+' orphan active contracts');
   if(unknownPermission)blockers.push(unknownPermission+' unknown trade permissions');
   if(restricted)blockers.push(restricted+' restricted player(s)');
   if(!validCap)blockers.push('team cap unavailable');
   else if(matched===roster.length&&payroll>cap)blockers.push('current payroll above source cap');
   if(!validLimit)blockers.push('roster limit unavailable');
   else if(roster.length>limit)blockers.push('roster exceeds source limit');
   output.push(Object.freeze({teamId:id,teamName:String(team.name||id),roster:roster.length,matched,missing,ambiguous,invalid,orphans,unknownPermission,restricted,
    capLimit:validCap?cap:null,rosterLimit:validLimit?limit:null,
    payroll:missing||ambiguous||invalid||orphans?null:payroll,
    sourceAuthenticated:false,sourceComplete:!blockers.length,blockers:Object.freeze(blockers)}));
  }
  return Object.freeze({ready:true,source:'current-saved-isolated-season',teams:Object.freeze(output),
   saved:false,sourceAuthenticated:false,contractImportAuthorized:false,settlementAuthorized:false,cpuConsentAuthenticated:false,
   message:'Read-only saved contract coverage, not trusted provenance or trade authorization. No imports, approval or settlement.'});
 }
 return Object.freeze({
  refresh(){const s=readState();baseline=s?JSON.stringify(s):null;return inspect()},
  review(){if(baseline===null)throw Error('Refresh saved franchise before review');const s=readState();
   if(!s||JSON.stringify(s)!==baseline){baseline=null;throw Error('Saved franchise changed. Refresh first')}
   const x=inspect();if(JSON.stringify(readState())!==baseline){baseline=null;throw Error('Saved franchise changed during review')}
   return x;},
  cancel(){baseline=null;return Object.freeze({saved:false,discarded:true})}
 });
}
return Object.freeze({create});
});
