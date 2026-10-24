/* M1575: evidence-only external contract file inspection for a saved isolated season.
 * Self-asserted source metadata + SHA-256 cannot authenticate a publisher.
 * Never writes, imports, authorizes transactions or changes saved contracts.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMSeasonContractIntake=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const id=value=>(typeof value==='string'&&/^[a-zA-Z0-9_.:-]{1,100}$/.test(value))?value:
 (typeof value==='number'&&Number.isSafeInteger(value)&&value>=0)?String(value):null;
const str=value=>typeof value==='string'&&value.trim().length>0&&value.length<=200?value.trim():null;
function create(readState){
 if(typeof readState!=='function')throw Error('Saved-season state reader required');
 let baseline=null;
 function inspect(){
  const state=readState();if(!state)throw Error('Load a saved isolated franchise first');
  if(!Array.isArray(state.universe?.players)||!Array.isArray(state.universe?.teams)||!Array.isArray(state.assets?.contracts))
   throw Error('Saved players, teams or contract ledger unavailable');
  const players=new Map(),teams=new Map();
  for(const t of state.universe.teams){const key=id(t?.id);if(!key||teams.has(key))throw Error('Ambiguous saved team identity');teams.set(key,t);}
  for(const p of state.universe.players){const key=id(p?.id);if(!key||players.has(key))throw Error('Ambiguous saved player identity');players.set(key,p);}
  if(!teams.has(id(state.meta?.controlledTeamId)))throw Error('Saved human-GM team identity unavailable');
  return {state,players,teams};
 }
 function begin(){
  baseline=null;
  const source=inspect();baseline=JSON.stringify(source.state);
  return Object.freeze({ready:true,saved:false,externalSourceAuthenticated:false});
 }
 function discard(){baseline=null;return Object.freeze({saved:false,discarded:true});}
 function preview(document){
  if(baseline===null)throw Error('Refresh the current saved season before source review');
  const source=inspect();
  if(JSON.stringify(source.state)!==baseline){discard();throw Error('Saved season changed; refresh and inspect again');}
  if(!document||typeof document!=='object'||Array.isArray(document)||document.schemaVersion!==1)
   throw Error('Unsupported contract evidence schema');
  const metadata=document.source;
  if(!metadata||typeof metadata!=='object'||!str(metadata.publisher)||!str(metadata.reference)||
   typeof metadata.asOfDate!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(metadata.asOfDate)||
   Number.isNaN(Date.parse(metadata.asOfDate+'T00:00:00Z'))||
   new Date(metadata.asOfDate+'T00:00:00Z').toISOString().slice(0,10)!==metadata.asOfDate)
   throw Error('Source publisher, reference and valid as-of date required (self-asserted only)');
  if(!Array.isArray(document.scope?.teamIds)||document.scope.teamIds.length<1||
   document.scope.teamIds.length>source.teams.size||!Array.isArray(document.contracts)||
   document.contracts.length<1||document.contracts.length>5000)
   throw Error('Explicit team coverage and bounded active contract records required');
  const covered=new Set();
  for(const raw of document.scope.teamIds){
   const key=id(raw);
   if(!key||!source.teams.has(key)||covered.has(key))throw Error('Unknown or repeated source coverage team');
   covered.add(key);
  }
  const seenContracts=new Set(),seenPlayers=new Set(),contracted=new Map();
  let unknownPermission=0,explicitRestrictions=0,existingMatches=0;
  const blockers=[];
  for(const c of document.contracts){
   const contractId=id(c?.contractId),playerId=id(c?.playerId),teamId=id(c?.teamId);
   if(!contractId||!playerId||!teamId||c.status!=='active'||
    typeof c.aav!=='number'||!Number.isFinite(c.aav)||c.aav<0||
    (c.tradePermission!==undefined&&!['allowed','restricted','unknown'].includes(c.tradePermission)))
    throw Error('Invalid supplied active contract identifier, amount or permission');
   if(seenContracts.has(contractId)||seenPlayers.has(playerId))throw Error('Duplicate supplied contract or active player record');
   seenContracts.add(contractId);seenPlayers.add(playerId);
   if(!covered.has(teamId))throw Error('Contract team outside declared coverage');
   const player=source.players.get(playerId);
   if(!player||id(player.teamId)!==teamId||player.retired===true||player.status===-1||player.status==='retired')
    throw Error('Contract player absent, retired or ownership mismatched with saved season');
   contracted.set(playerId,{contractId,teamId,aav:c.aav});
   if(c.tradePermission===undefined||c.tradePermission==='unknown')unknownPermission++;
   if(c.tradePermission==='restricted')explicitRestrictions++;
   const saved=source.state.assets.contracts.filter(x=>x&&x.status==='active'&&id(x.playerId)===playerId);
   if(saved.length>1)blockers.push('Multiple saved active contracts for player '+playerId);
   else if(saved.length===1){
    const match=saved[0];
    if(id(match.contractId)!==contractId||id(match.teamId)!==teamId||match.aav!==c.aav)
     blockers.push('External record conflicts with saved active contract for '+playerId);
    else existingMatches++;
   }
  }
  const roster=Array.from(source.players.values()).filter(p=>covered.has(id(p.teamId))&&
    p.retired!==true&&p.status!==-1&&p.status!=='retired');
  const missing=roster.filter(p=>!contracted.has(id(p.id)));
  if(missing.length)blockers.push(missing.length+' covered roster player(s) have no supplied active contract');
  if(unknownPermission)blockers.push(unknownPermission+' contract(s) lack explicit trade permission');
  if(explicitRestrictions)blockers.push(explicitRestrictions+' contract(s) explicitly restrict trades');
  const result={
   sourcePublisher:metadata.publisher.trim(),sourceReference:metadata.reference.trim(),sourceAsOfDate:metadata.asOfDate,
   coveredTeamCount:covered.size,coveredRosterCount:roster.length,matchedContractCount:contracted.size,
   existingSavedMatchCount:existingMatches,missingCoveredRosterCount:missing.length,
   unknownTradePermissionCount:unknownPermission,restrictedTradeCount:explicitRestrictions,
   evidenceCompleteForDeclaredScope:blockers.length===0,
   blockers:Object.freeze(blockers),identityMatched:true,sourcePublisherAuthenticated:false,
   saved:false,contractsImported:false,gameStateChanged:false,settlementAuthorized:false,cpuConsentAuthenticated:false,
   message:'External metadata is self-asserted. Identity checks and a file fingerprint do not authenticate contract provenance, create cap/roster authority, verify receiving-team consent, or permit a trade. Nothing imported or saved.'
  };
  // A second read rejects concurrent changes during inspection in custom readers.
  if(JSON.stringify(inspect().state)!==baseline){discard();throw Error('Saved season changed during review; refresh first');}
  return Object.freeze(result);
 }
 return Object.freeze({begin,preview,discard});
}
return Object.freeze({create});
});
