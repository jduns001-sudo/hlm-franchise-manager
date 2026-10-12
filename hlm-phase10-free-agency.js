'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/** Read-only free-agent pool based on explicitly expired contract records. */
function listOffseasonFreeAgents(state){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  const players=new Map(state.universe.players.filter(p=>p&&p.id!=null).map(p=>[String(p.id),p]));
  const activePlayers=new Set(state.assets.contracts.filter(c=>c&&c.status!=='expired'&&c.playerId!=null).map(c=>String(c.playerId)));
  const freeAgents=new Map();
  for(const c of state.assets.contracts){
    if(!c||c.status!=='expired'||c.playerId==null)continue;
    const key=String(c.playerId);
    if(activePlayers.has(key)||!players.has(key))continue;
    const p=players.get(key);
    freeAgents.set(key,{playerId:p.id,name:p.name??null,previousTeamId:c.teamId??null});
  }
  return {freeAgents:[...freeAgents.values()].sort((a,b)=>String(a.playerId).localeCompare(String(b.playerId))),count:freeAgents.size};
}
module.exports={listOffseasonFreeAgents};
