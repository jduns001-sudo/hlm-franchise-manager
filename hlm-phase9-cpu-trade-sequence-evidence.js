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
