'use strict';
/* Read-only choices from the selected persisted synthetic franchise. */
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const deny=code=>({ok:false,code,saved:false});
async function listPlayers(options={}){
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.syntheticTestAuthorization!==true||options.realTradeSettlement===true)return deny('synthetic-test-authorization-required');
 const name=options.experimentalDatabaseName;
 if(typeof name!=='string'||!/^hlm-phase11-[a-zA-Z0-9_-]*experimental[a-zA-Z0-9_-]*$/.test(name))return deny('isolated-experimental-database-required');
 try{
  const {game,ledger}=await store.read(name);
  if(!game||!ledger)return deny('persisted-source-required');
  if(validateGameStateEnvelope(game).valid!==true)return deny('invalid-source-state');
  if(!Number.isSafeInteger(game.meta?.revision)||game.meta.revision<1||ledger.revision!==game.meta.revision)return deny('stale-persisted-revision');
  const players=game.universe.players,teams=game.universe.teams,contracts=game.assets.contracts;
  if(new Set(players.map(p=>String(p.id))).size!==players.length||new Set(teams.map(t=>String(t.id))).size!==teams.length)return deny('ambiguous-source-identity');
  const controlled=String(game.meta.controlledTeamId),teamMap=new Map(teams.map(t=>[String(t.id),t]));
  if(!teamMap.has(controlled))return deny('controlled-team-required');
  const activeByPlayer=new Map();
  for(const contract of contracts)if(contract.status==='active'){
   const id=String(contract.playerId),matches=activeByPlayer.get(id)||[];matches.push(contract);activeByPlayer.set(id,matches);
  }
  const outgoing=[],incoming=[];
  for(const player of players){
   const team=teamMap.get(String(player.teamId));
   const active=activeByPlayer.get(String(player.id))||[];
   if(!team||active.length!==1||String(active[0].teamId)!==String(player.teamId))continue;
   const playerName=typeof player.name==='string'&&player.name.trim()?player.name.trim():String(player.id);
   const teamName=typeof team.name==='string'&&team.name.trim()?team.name.trim():String(team.id);
   const option={id:String(player.id),teamId:String(team.id),label:playerName+' — '+teamName+' ('+String(player.id)+')'};
   (String(player.teamId)===controlled?outgoing:incoming).push(option);
  }
  const sort=(a,b)=>a.label.localeCompare(b.label)||a.id.localeCompare(b.id);outgoing.sort(sort);incoming.sort(sort);
  return {ok:true,revision:game.meta.revision,outgoing,incoming,saved:false};
 }catch{return deny('isolated-storage-error')}
}
module.exports={listPlayers};
