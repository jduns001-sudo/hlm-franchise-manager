'use strict';
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createRosterLabSeasonStore}=require('./hlm-phase10-roster-lab-season-store');
const {calculateStandings}=require('./hlm-phase10-standings');
const {addCalendarDays}=require('./hlm-master-calendar');
function createRosterLabFranchise(){
 const teams=[{id:1,name:'Northport Wolves'},{id:2,name:'Lakeside Falcons'},{id:3,name:'Summit Bears'},{id:4,name:'Riverton Blades'}];
 const positions=['C','LW','RW','D','D','G'];
 const players=teams.flatMap(t=>positions.map((position,i)=>({id:t.id*100+i,teamId:t.id,position,ovr:72+t.id*3+i})));
 const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
 const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
 const games=[];
 const start='2026-10-13';
 for(let day=1;day<=28;day++){
  const date=addCalendarDays(start,day);
  const pairs=day%2?[[1,2],[3,4]]:[[1,3],[2,4]];
  for(const [homeTeamId,awayTeamId] of pairs)games.push({id:'G'+day+'-'+homeTeamId,date,status:'scheduled',homeTeamId,awayTeamId});
 }
 return createGameStateEnvelope({meta:{saveId:'phase10-roster-lab',controlledTeamId:1,currentDate:start},teams,players,contracts,injuries,games});
}
function createRosterBrowserStore(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw new TypeError('Storage API required');
 return createRosterLabSeasonStore(storage);
}
module.exports={createRosterLabFranchise,createRosterBrowserStore,calculateStandings,addCalendarDays};
