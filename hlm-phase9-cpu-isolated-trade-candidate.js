'use strict';
// Executes only an isolated candidate trade. Never changes the source save.
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {inspectCPUExecutionBoundary}=require('./hlm-phase9-cpu-execution-boundary');
const {createTradeExecutionCandidate}=require('./hlm-trade-execution-candidate');
function fail(code,message){const error=new Error(message);error.code=code;throw error;}
function createIsolatedCPUTradeCandidate(state,teamId,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_CPU_TRADE_STATE','Valid GameState required');
 const id=String(teamId??'');
 if(!state.universe.teams.some(team=>String(team.id)===id))fail('CPU_TRADE_TEAM_NOT_FOUND','CPU team not found');
 const controlled=state.meta?.controlledTeamId;
 if(controlled!=null&&String(controlled)===id)fail('CPU_TRADE_HUMAN_TEAM_PROTECTED','CPU cannot control the human franchise');
 if(input.humanGMApproved!==true)fail('CPU_TRADE_APPROVAL_REQUIRED','Explicit human approval required for this isolated trade path');
 if(!Array.isArray(input.teamIds)||!input.teamIds.map(String).includes(id))fail('CPU_TRADE_PARTICIPANT_REQUIRED','CPU team must participate');
 if(controlled!=null&&input.teamIds.map(String).includes(String(controlled)))fail('CPU_TRADE_HUMAN_TEAM_PROTECTED','Human-controlled franchise cannot be traded by CPU integration');
 // Reject ambiguous source records before the underlying candidate mover selects the first match.
 const movedAssets=Array.isArray(input.legs)?input.legs.flatMap(leg=>Array.isArray(leg.assets)?leg.assets:[]):[];
 for(const asset of movedAssets){
  if(!asset||!['player','prospect','draft-pick'].includes(asset.type))continue;
  const records=asset.type==='draft-pick'?state.assets.draftPicks:state.universe.players;
  const matches=records.filter(row=>String(asset.type==='draft-pick'?(row.id??row.pickId):row.id)===String(asset.id));
  if(matches.length>1)fail('CPU_TRADE_DUPLICATE_SOURCE_RECORD','Traded asset ID resolves to multiple source records');
 }
 const before=JSON.stringify(state);
 const boundary=inspectCPUExecutionBoundary(state,id,{decision:input.decision||{}});
 const result=createTradeExecutionCandidate(state,input);
 if(!result.verification.sourceGameStateProtected||JSON.stringify(state)!==before)fail('CPU_TRADE_SOURCE_CHANGED','Source GameState changed');
 const candidate=result.candidateState;
 const teams=new Set(state.universe.teams.map(team=>String(team.id)));
 const seen=new Set();
 const financeRowsForTrade=Array.isArray(state.finances)?state.finances:Object.values(state.finances||{});
 const playerMoves=result.gate.verification.candidate.legs.flatMap(leg=>leg.assets.filter(asset=>asset.type==='player'||asset.type==='prospect'));
 if(playerMoves.length>1&&financeRowsForTrade.some(row=>row&&result.gate.verification.candidate.teamIds.map(String).includes(String(row.teamId))))
  fail('CPU_TRADE_MULTI_PLAYER_CAP_UNSUPPORTED','Multi-player financial reconciliation is not yet supported');
 for(const leg of result.gate.verification.candidate.legs){
  for(const asset of leg.assets){
   const key=asset.type+':'+asset.id;
   if(seen.has(key))fail('CPU_TRADE_DUPLICATE_ASSET','Same asset cannot move twice');
   seen.add(key);
   if(asset.type==='player'||asset.type==='prospect'){
    const linkedContracts=state.assets.contracts.filter(contract=>String(contract.playerId)===asset.id);
    if(linkedContracts.length>1)
     fail('CPU_TRADE_MULTIPLE_LINKED_CONTRACTS','Cannot transfer a player with ambiguous multiple linked contracts');
    if(linkedContracts.some(contract=>String(contract.teamId)!==leg.fromTeamId))
     fail('CPU_TRADE_CONTRACT_OWNER_MISMATCH','Linked contract must belong to sending team');
    const financeRows=Array.isArray(state.finances)?state.finances:Object.values(state.finances||{});
    if(financeRows.some(row=>row&&[leg.fromTeamId,leg.toTeamId].includes(String(row.teamId)))){
     const rowsForTeam=team=>financeRows.filter(row=>row&&String(row.teamId)===team);
     const from=rowsForTeam(leg.fromTeamId),to=rowsForTeam(leg.toTeamId);
     if(from.length!==1||to.length!==1||
        from.some(row=>!Number.isSafeInteger(row.payroll)||!Number.isSafeInteger(row.capLimit))||
        to.some(row=>!Number.isSafeInteger(row.payroll)||!Number.isSafeInteger(row.capLimit))||
        String(from[0].seasonId??'')!==String(to[0].seasonId??'')||
        linkedContracts.length!==1||!Number.isSafeInteger(linkedContracts[0].aav)||linkedContracts[0].aav<0)
      fail('CPU_TRADE_CAP_RECONCILIATION_UNSUPPORTED','Exact matching finance rows and one numeric contract AAV required');
     if(from[0].payroll<0||to[0].payroll<0||from[0].capLimit<0||to[0].capLimit<0||
        from[0].payroll>from[0].capLimit||to[0].payroll>to[0].capLimit)
      fail('CPU_TRADE_INVALID_BASELINE_FINANCES','Trade cannot reconcile invalid or already over-cap baseline payroll');
     const aav=linkedContracts[0].aav;
     const fromPayroll=from[0].payroll-aav,toPayroll=to[0].payroll+aav;
     if(!Number.isSafeInteger(fromPayroll)||!Number.isSafeInteger(toPayroll)||fromPayroll<0||
        fromPayroll>from[0].capLimit||toPayroll>to[0].capLimit)
      fail('CPU_TRADE_CAP_LIMIT_EXCEEDED','Trade would produce invalid payroll or exceed team cap');
     const candidateRows=Array.isArray(candidate.finances)?candidate.finances:Object.values(candidate.finances||{});
     const cf=candidateRows.find(row=>row&&String(row.teamId)===leg.fromTeamId);
     const ct=candidateRows.find(row=>row&&String(row.teamId)===leg.toTeamId);
     cf.payroll=fromPayroll;ct.payroll=toPayroll;
    }
   }
   const original=asset.type==='draft-pick'?state.assets.draftPicks.find(p=>String(p.id??p.pickId)===asset.id):state.universe.players.find(p=>String(p.id)===asset.id);
   if(!original)fail('CPU_TRADE_ASSET_NOT_FOUND','Source asset not found');
   if(asset.type==='draft-pick'&&original.currentOwnerId!=null&&original.ownerTeamId!=null&&
      String(original.currentOwnerId)!==String(original.ownerTeamId))
    fail('CPU_TRADE_PICK_OWNER_CONFLICT','Conflicting draft pick ownership fields must be resolved before trading');
   const owner=asset.type==='draft-pick'?original.currentOwnerId??original.ownerTeamId??original.teamId:original.teamId;
   if(String(owner)!==leg.fromTeamId)fail('CPU_TRADE_OWNERSHIP_MISMATCH','Actual asset owner differs from sending team');
   if(!teams.has(leg.toTeamId))fail('CPU_TRADE_DESTINATION_UNKNOWN','Receiving team missing');
   const moved=asset.type==='draft-pick'?candidate.assets.draftPicks.find(p=>String(p.id??p.pickId)===asset.id):candidate.universe.players.find(p=>String(p.id)===asset.id);
   if(!moved||String(asset.type==='draft-pick'?(moved.currentOwnerId??moved.ownerTeamId??moved.teamId):moved.teamId)!==leg.toTeamId)
    fail('CPU_TRADE_CANDIDATE_MISMATCH','Candidate ownership not updated correctly');
   if(asset.type==='player'||asset.type==='prospect'){
    for(const contract of candidate.assets.contracts.filter(row=>String(row.playerId)===asset.id)){
     contract.teamId=leg.toTeamId;
    }
   }
  }
 }
 const transactionId=typeof input.transactionId==='string'?input.transactionId.trim():'';
 if(!transactionId)fail('CPU_TRADE_TRANSACTION_ID_REQUIRED','Unique transaction ID required for audit history');
 if(state.activity.transactions.some(tx=>String(tx.id)===transactionId))
  fail('CPU_TRADE_TRANSACTION_ID_DUPLICATE','Transaction ID already recorded');
 const legs=result.gate.verification.candidate.legs.map(leg=>({
  fromTeamId:leg.fromTeamId,toTeamId:leg.toTeamId,
  assets:leg.assets.map(asset=>({type:asset.type,id:asset.id}))
 }));
 candidate.activity.transactions.push({
  id:transactionId,type:'cpu-trade',date:state.meta.currentDate??null,
  teamIds:result.gate.verification.candidate.teamIds.slice(),legs,
  humanGMApproved:true,source:'phase9-isolated-cpu-trade-candidate'
 });
 if(!validateGameStateEnvelope(candidate).valid)fail('CPU_TRADE_CANDIDATE_INVALID','Candidate invalid');
 return Object.freeze({kind:'phase9-isolated-cpu-trade-candidate',version:1,teamId:id,
  candidateState:candidate,boundary,assetCount:seen.size,sourceStateMutated:false,
  candidateOnly:true,liveExecutionPerformed:false,persistencePerformed:false,
  readyForLiveExecution:false});
}
module.exports={createIsolatedCPUTradeCandidate};
