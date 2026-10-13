'use strict';
const {prepareDayAdvance}=require('./hlm-phase10-day-advance');
const {executeControlledRosterGame}=require('./hlm-phase10-controlled-roster-game');
const {calculateStandings}=require('./hlm-phase10-standings');

/** Experimental roster-backed daily tick. Atomic: blocked games never advance date. */
function simulateControlledRosterDay(state,seed=1,options={}) {
 if (!options || options.experimental!==true || options.persist===true) {
  const error=new Error('Experimental nonpersistent mode required');
  error.code='CONTROLLED_ROSTER_DAY_NOT_ENABLED';throw error;
 }
 if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Invalid day seed');
 const day=prepareDayAdvance(state);
 const games=day.nextState.activity.games.filter(g=>g.status==='scheduled'&&g.date===day.toDate);
 const ids=games.map(g=>String(g.id));
 if(ids.some(id=>id==='undefined')||new Set(ids).size!==ids.length){
  const error=new Error('Duplicate or missing game ID');
  error.code='INVALID_ROSTER_DAY_SCHEDULE';throw error;
 }
 let candidate=day.nextState;
 const results=[];
 const blocked=[];
 for(const game of games){
  const outcome=executeControlledRosterGame(candidate,game.id,seed,{experimental:true});
  if(!outcome.applied){
   blocked.push({gameId:game.id,blockers:outcome.blockers});
  }else{
   candidate=outcome.nextState;
   results.push(outcome.game);
  }
 }
 if(blocked.length)return {advanced:false,blocked,results:[],nextState:null,
  fromDate:day.fromDate,toDate:day.toDate,official:false,persistencePerformed:false};
 const standings=calculateStandings(candidate.universe.teams,candidate.activity.games);
 return {advanced:true,blocked:[],results,nextState:candidate,standings,
  fromDate:day.fromDate,toDate:day.toDate,official:false,persistencePerformed:false};
}
module.exports={simulateControlledRosterDay};
