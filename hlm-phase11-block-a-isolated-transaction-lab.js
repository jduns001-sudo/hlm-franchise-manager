'use strict';
// Isolated transactional persistence proof of concept. No CPU trust or production connection.
// The caller cannot use this simulation to authorize a real franchise settlement.
const {validateGameStateEnvelope}=require('./hlm-game-state');
function createIsolatedTransactionLab(initialState,initialRevision='revision-1'){
 if(!validateGameStateEnvelope(initialState).valid)throw Error('Valid GameState required');
 if(typeof initialRevision!=='string'||!initialRevision)throw Error('Revision required');
 let state=JSON.parse(JSON.stringify(initialState)),revision=initialRevision;
 const spent=new Set();
 const snapshot=()=>Object.freeze({state:JSON.parse(JSON.stringify(state)),revision,consumedDecisionIds:[...spent]});
 function simulate(request){
  const blocked=code=>Object.freeze({status:'blocked',code,committed:false,productionSaved:false,independentlyAuthenticated:false});
  if(!request||request.experimentalEnabled!==true)return blocked('default-off');
  if(request.cancelled===true||request.declined===true)return blocked('gm-cancelled-or-declined');
  if(request.gmApproved!==true)return blocked('gm-approval-required');
  if(request.expectedRevision!==revision)return blocked('stale-revision');
  if(typeof request.decisionId!=='string'||!request.decisionId||spent.has(request.decisionId))return blocked('invalid-or-replayed-decision');
  const changes=request.changes;
  if(!changes||!['players','contracts','picks','prospects'].every(k=>Array.isArray(changes[k])))return blocked('invalid-changes');
  const working=JSON.parse(JSON.stringify(state)),workingSpent=new Set(spent);
  const move=(items,transfers,idOf,ownerKey,verify)=>{
   const seen=new Set();
   for(const t of transfers){
    const id=String(t?.id??t?.playerId??''),from=String(t?.from??''),to=String(t?.to??'');
    if(!id||!from||!to||from===to||seen.has(id))throw Error('invalid-transfer');
    seen.add(id);
    const matches=items.filter(x=>String(idOf(x))===id&&String(x[ownerKey])===from&&(!verify||verify(x)));
    if(matches.length!==1)throw Error('unverified-ownership');
    matches[0][ownerKey]=to;
   }
  };
  try{
   const pids=changes.players.map(p=>String(p.id)),cids=changes.contracts.map(c=>String(c.playerId));
   if(pids.length!==cids.length||pids.some(id=>!cids.includes(id)))throw Error('unpaired-contract');
   move(working.universe.players,changes.players,x=>x.id,'teamId');
   move(working.assets.contracts,changes.contracts,x=>x.playerId,'teamId',x=>x.status!=='expired');
   move(working.assets.draftPicks,changes.picks,x=>x.pickId??x.id,'currentOwnerId',x=>x.status==='AVAILABLE');
   move(working.universe.prospects,changes.prospects,x=>x.id,'rightsTeamId',x=>x.draftPickId!=null);
   if(request.injectFailure===true)throw Error('simulated-transaction-failure');
   working.activity.transactions.push({kind:'isolated-lab-transfer',decisionId:request.decisionId,revisionFrom:revision});
   if(!validateGameStateEnvelope(working).valid)throw Error('invalid-result-state');
   workingSpent.add(request.decisionId);
   // In-memory commit of state, revision and replay marker occurs only after all checks.
   state=working;spent.clear();for(const id of workingSpent)spent.add(id);
   revision='lab-'+String(Number(revision.match(/\d+$/)?.[0]??0)+1);
   return Object.freeze({status:'isolated-lab-committed',committed:true,productionSaved:false,independentlyAuthenticated:false,revision});
  }catch(e){return blocked(e.message)}
 }
 return Object.freeze({snapshot,simulate});
}
module.exports={createIsolatedTransactionLab};
