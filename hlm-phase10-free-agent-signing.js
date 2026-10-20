'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/** Sign a free agent to a team using explicit cap room and canonical contract fields. */
function signOffseasonFreeAgent(state,{playerId,teamId,contractId,aav,years,season,capLimit}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(playerId==null||teamId==null||typeof contractId!=='string'||!contractId.trim())throw new TypeError('Player, team and contract ID required');
  if(!state.universe.teams.some(t=>String(t.id)===String(teamId)))throw new Error('Team not found');
  const hasExpired=state.assets.contracts.some(c=>c&&c.status==='expired'&&String(c.playerId)===String(playerId));
  const hasActive=state.assets.contracts.some(c=>c&&c.status!=='expired'&&String(c.playerId)===String(playerId));
  if(!hasExpired||hasActive||!state.universe.players.some(p=>String(p.id)===String(playerId)))throw new Error('Player is not an eligible free agent');
  if(state.assets.contracts.some(c=>String(c.contractId??c.id)===contractId))throw new Error('Contract ID already exists');
  if(!Number.isFinite(aav)||aav<0||!Number.isSafeInteger(years)||years<1||years>15)throw new RangeError('Invalid salary or term');
  if(typeof season!=='string'||!season.trim())throw new TypeError('Season is required');
  if(!Number.isFinite(capLimit)||capLimit<0)throw new RangeError('Valid cap limit required');
  const activePayroll=state.assets.contracts.filter(c=>String(c.teamId)===String(teamId)&&c.status!=='expired').reduce((sum,c)=>sum+Number(c.aav||0),0);
  if(state.assets.contracts.some(c=>String(c.teamId)===String(teamId)&&c.status!=='expired'&&(!Number.isFinite(Number(c.aav))||Number(c.aav)<0)))throw new Error('Existing payroll has invalid salaries');
  if(activePayroll+aav>capLimit)throw new Error('Signing exceeds salary cap');
  const nextState=JSON.parse(JSON.stringify(state));
  const contract={contractId,playerId,teamId,aav,years,season,status:'active'};
  nextState.assets.contracts.push(contract);
  // The approved signing must change the actual team roster, not only its contract ledger.
  const signedPlayer=nextState.universe.players.find(p=>String(p.id)===String(playerId));
  signedPlayer.teamId=teamId;
  return {nextState,contract,summary:{playerId,teamId,contractId,projectedPayroll:activePayroll+aav,capSpace:capLimit-activePayroll-aav}};
}
module.exports={signOffseasonFreeAgent};
