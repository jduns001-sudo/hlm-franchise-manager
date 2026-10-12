'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/**
 * Explicit offseason expiration transaction.
 * Call only with verified expiring contract IDs from the season rules engine.
 * Does not guess expiry from ambiguous years/season fields.
 */
function expireOffseasonContracts(state,contractIds){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(!Array.isArray(contractIds))throw new TypeError('Contract IDs must be an array');
  const ids=contractIds.map(String);
  if(new Set(ids).size!==ids.length)throw new Error('Duplicate contract IDs');
  const contracts=state.assets.contracts;
  for(const id of ids){
    const matches=contracts.filter(c=>c&&(c.contractId??c.id)!=null&&String(c.contractId??c.id)===id);
    if(matches.length!==1)throw new Error('Contract ID missing or ambiguous: '+id);
    if(matches[0].status==='expired')throw new Error('Contract already expired: '+id);
  }
  const selected=new Set(ids);
  const nextState=JSON.parse(JSON.stringify(state));
  const expired=[];
  for(const contract of nextState.assets.contracts){
    if(contract&&(contract.contractId??contract.id)!=null&&selected.has(String(contract.contractId??contract.id))){
      contract.status='expired';
      expired.push(String(contract.contractId??contract.id));
    }
  }
  return {nextState,summary:{expiredContractIds:expired,expiredCount:expired.length,unchangedCount:contracts.length-expired.length}};
}
module.exports={expireOffseasonContracts};
