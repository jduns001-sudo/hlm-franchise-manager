'use strict';
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialIsolatedCPUTradeCandidates}=require('./hlm-phase9-cpu-trade-sequence');
function summarizeCPUTradeSequence(state,steps){
 const result=createSequentialIsolatedCPUTradeCandidates(state,steps);
 const before=state,after=result.candidateState;
 const playerMoves=[];
 for(const p of before.universe.players){
  const matches=after.universe.players.filter(x=>String(x.id)===String(p.id));
  if(matches.length===1&&String(matches[0].teamId)!==String(p.teamId))
   playerMoves.push(Object.freeze({playerId:String(p.id),fromTeamId:String(p.teamId),toTeamId:String(matches[0].teamId)}));
 }
 const pickMoves=[];
 for(const p of before.assets.draftPicks){
  const id=String(p.id??p.pickId);
  const matches=after.assets.draftPicks.filter(x=>String(x.id??x.pickId)===id);
  if(matches.length===1){
   const from=p.currentOwnerId??p.ownerTeamId??p.teamId;
   const to=matches[0].currentOwnerId??matches[0].ownerTeamId??matches[0].teamId;
   if(String(from)!==String(to))pickMoves.push(Object.freeze({pickId:id,fromTeamId:String(from),toTeamId:String(to)}));
  }
 }
 // Reject ambiguous source IDs rather than silently omit changes from the audit.
 for(const [beforeItems,afterItems,key,label] of [
  [before.universe.players,after.universe.players,x=>String(x.id),'PLAYER'],
  [before.assets.draftPicks,after.assets.draftPicks,x=>String(x.id??x.pickId),'PICK']
 ]){
  const count=items=>{const counts=new Map();for(const item of items){const id=key(item);counts.set(id,(counts.get(id)||0)+1);}return counts;};
  const oldCount=count(beforeItems),newCount=count(afterItems);
  if([...oldCount.values(),...newCount.values()].some(n=>n>1)){
   const e=new Error('Ambiguous '+label.toLowerCase()+' identifier in CPU trade audit');e.code='CPU_TRADE_AUDIT_DUPLICATE_'+label+'_ID';throw e;
  }
 }
 const financialChanges=[];
 const rows=finance=>Array.isArray(finance)?finance:Object.values(finance||{});
 const beforeRows=rows(before.finances),afterRows=rows(after.finances);
 for(const row of beforeRows){
  if(!row||row.teamId==null||row.seasonId==null)continue;
  const keyTeam=String(row.teamId),keySeason=String(row.seasonId);
  const oldMatches=beforeRows.filter(x=>x&&String(x.teamId)===keyTeam&&String(x.seasonId)===keySeason);
  const newMatches=afterRows.filter(x=>x&&String(x.teamId)===keyTeam&&String(x.seasonId)===keySeason);
  if(oldMatches.length!==1||newMatches.length!==1)continue;
  const next=newMatches[0];
  if(Number.isSafeInteger(row.payroll)&&Number.isSafeInteger(next.payroll)&&row.payroll!==next.payroll)
   financialChanges.push(Object.freeze({teamId:keyTeam,seasonId:keySeason,beforePayroll:row.payroll,afterPayroll:next.payroll,change:next.payroll-row.payroll}));
 }
 const originalTransactions=new Set(before.activity.transactions.map(t=>String(t.id)));
 const transactionIds=after.activity.transactions.filter(t=>!originalTransactions.has(String(t.id))).map(t=>String(t.id));
 return Object.freeze({kind:'phase9-cpu-trade-sequence-evidence',version:1,
  stepCount:result.steps.length,transactionIds:Object.freeze(transactionIds),
  playerMoves:Object.freeze(playerMoves),draftPickMoves:Object.freeze(pickMoves),financialChanges:Object.freeze(financialChanges),
  sourceStateFingerprint:serializeGameState(before),candidateStateFingerprint:serializeGameState(after),
  candidateOnly:true,productionCPUExecutionEnabled:false});
}
module.exports={summarizeCPUTradeSequence};
