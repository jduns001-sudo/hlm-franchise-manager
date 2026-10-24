'use strict';
/* Read only committed experimental records. Never reconstruct legacy trades
 * from current ownership or claim authenticated consent from ledger membership. */
function tradeHistory(game,ledger){
 const deny=()=>({ok:false,code:'invalid-trade-history',entries:[]});
 const revision=game?.meta?.revision,transactions=game?.activity?.transactions;
 if(!Number.isSafeInteger(revision)||revision<1||ledger?.revision!==revision||
  !Array.isArray(transactions)||!Array.isArray(ledger.events))return deny();
 const records=transactions.filter(t=>t?.type==='experimental-player-trade');
 const seenIds=new Set(),seenRevisions=new Set();
 const text=x=>typeof x==='string'&&x.trim().length>0;
 for(const t of records){
  if(!text(t.id)||seenIds.has(t.id)||seenRevisions.has(t.revision)||
   transactions.filter(x=>x?.id===t.id).length!==1||
   t.experimental!==true||t.gmApproved!==true||t.cpuConsentAuthenticated!==false||
   t.productionSettlementAuthorized!==false||!Number.isSafeInteger(t.sourceRevision)||t.sourceRevision<1||
   t.revision!==t.sourceRevision+1||t.revision>revision||
   ledger.events.filter(e=>e?.id===t.id&&e.experimental===true).length!==1||
   ledger.events.filter(e=>e?.id===t.id).length!==1||
   !Array.isArray(t.transfers)||t.transfers.length!==2)return deny();
  const [a,b]=t.transfers;
  if(![a,b].every(p=>p&&['playerId','playerName','fromTeamId','fromTeamName','toTeamId','toTeamName'].every(k=>text(p[k]))&&
   typeof p.aav==='number'&&Number.isFinite(p.aav)&&p.aav>=0)||
   a.playerId===b.playerId||a.fromTeamId===a.toTeamId||a.fromTeamId!==b.toTeamId||a.toTeamId!==b.fromTeamId)return deny();
  seenIds.add(t.id);seenRevisions.add(t.revision);
 }
 // Fresh values; callers cannot mutate their loaded GameState through this view.
 return {ok:true,entries:records.slice().sort((a,b)=>b.revision-a.revision).map(t=>({id:t.id,revision:t.revision,
  transfers:t.transfers.map(p=>({playerId:p.playerId,playerName:p.playerName,fromTeamId:p.fromTeamId,
   fromTeamName:p.fromTeamName,toTeamId:p.toTeamId,toTeamName:p.toTeamName,aav:p.aav}))}))};
}
module.exports={tradeHistory};
