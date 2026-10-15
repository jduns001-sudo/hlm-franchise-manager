'use strict';
const {createIsolatedSeasonStore}=require('./hlm-phase11-isolated-season-atomic-store');
const {simulateControlledRosterDay}=require('./hlm-phase10-controlled-roster-day');
function createPersistentMultidaySeason(adapter,options){
 const store=createIsolatedSeasonStore(adapter,options);
 function advanceDays(days,{confirmed=false,seed=1}={}){
  if(confirmed!==true)throw Error('Explicit multiday experimental save confirmation required');
  if(!Number.isSafeInteger(days)||days<1||days>31)throw Error('Days must be 1 through 31');
  if(!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid seed');
  if(store.hasPendingRecovery())throw Error('Recovery required before multiday advancement');
  const baseline=adapter.read(store.key);
  const initial=store.load();
  if(!initial)throw Error('No isolated season save');
  let candidate=initial;const daysResults=[];
  for(let i=0;i<days;i++){
   const result=simulateControlledRosterDay(candidate,seed+i,{experimental:true,persist:false});
   if(!result.advanced)return {saved:false,advancedDays:0,blocked:[{day:i+1,blockers:result.blocked}],days:[],official:false,persistencePerformed:false};
   candidate=result.nextState;
   daysResults.push({date:result.toDate,games:result.results,standings:result.standings});
  }
  store.save(candidate,{expectedRaw:baseline});
  return {saved:true,advancedDays:days,blocked:[],days:daysResults,currentDate:candidate.meta.currentDate,official:false,persistencePerformed:true};
 }
 return Object.freeze({advanceDays,load:store.load,recover:store.recover,hasPendingRecovery:store.hasPendingRecovery,key:store.key,productionActivationEnabled:false});
}
module.exports={createPersistentMultidaySeason};
