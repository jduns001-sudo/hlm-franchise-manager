'use strict';
const {simulateControlledRosterDay}=require('./hlm-phase10-controlled-roster-day');
const {buildExperimentalGoalEvents,aggregateExperimentalGoals}=require('./hlm-phase10-experimental-player-goals');
const {buildUnifiedBoxScores}=require('./hlm-phase11-unified-box-scores');
/** Atomic day simulation with synthetic player goals, persisted only by caller. */
function simulateRosterDayWithGoalStats(state,seed=1,options={}){
 const result=simulateControlledRosterDay(state,seed,options);
 if(!result.advanced)return {...result,goalEvents:[],goalLeaders:[]};
 const nextState=result.nextState;
 const existing=Array.isArray(nextState.extensions.phase10ExperimentalGoalEvents)?
  nextState.extensions.phase10ExperimentalGoalEvents:[];
 const newEvents=result.results.flatMap(game=>buildExperimentalGoalEvents(nextState,game,seed));
 const keys=new Set(existing.map(e=>String(e.gameId)+':'+String(e.teamId)+':'+String(e.sequence)));
 for(const event of newEvents){
  const key=String(event.gameId)+':'+String(event.teamId)+':'+String(event.sequence);
  if(keys.has(key))throw new Error('Duplicate experimental goal event '+key);
  keys.add(key);
 }
 const goalEvents=existing.concat(newEvents);
 nextState.extensions.phase10ExperimentalGoalEvents=goalEvents;
 const goalLeaders=aggregateExperimentalGoals(goalEvents);
 const boxScores=buildUnifiedBoxScores(nextState,result.results,newEvents,seed);
 const prior=Array.isArray(nextState.extensions.phase11ExperimentalBoxScores)?nextState.extensions.phase11ExperimentalBoxScores:[];
 nextState.extensions.phase11ExperimentalBoxScores=prior.concat(boxScores);
 nextState.extensions.phase10ExperimentalGoalLeaders=goalLeaders;
 return {...result,goalEvents:newEvents,goalLeaders,boxScores};
}
module.exports={simulateRosterDayWithGoalStats};
