'use strict';

/** Phase 3 Mission 191: isolated daily tick calendar execution. */
const {assertDailyTickAuthorized}=require('./hlm-daily-tick-authorization');
const {executeIsolatedCalendarAdvancement}=require('./hlm-calendar-advancement-execution');

function executionError(message){const error=new Error(message);error.code='DAILY_TICK_CALENDAR_EXECUTION_FAILED';return error;}

function executeIsolatedDailyTickCalendar(input={}){
 const calendar=input.calendar,plan=input.plan,authorization=input.authorization;
 try{assertDailyTickAuthorized(plan,authorization);}catch(_){throw executionError('Daily tick is not authorized for the exact plan.');}
 if(!calendar||calendar.kind!=='master-hockey-calendar'||typeof calendar.currentDate!=='string')throw executionError('A master hockey calendar is required.');
 if(calendar.currentDate!==plan.fromDate)throw executionError('Source calendar date does not match the authorized daily tick plan.');
 let advancementResult;
 try{advancementResult=executeIsolatedCalendarAdvancement({calendar,plan:plan.calendarPlan,authorization:authorization.calendarAuthorization});}
 catch(_){throw executionError('Underlying one-day calendar advancement failed.');}
 if(advancementResult.days!==1||advancementResult.fromDate!==plan.fromDate||advancementResult.toDate!==plan.toDate||
 advancementResult.calendar.currentDate!==plan.toDate||advancementResult.dueEvents!==plan.dueEvents||advancementResult.phaseChanges!==plan.phaseChanges)
  throw executionError('Underlying calendar result does not match the authorized daily tick.');
 return Object.freeze({kind:'isolated-daily-tick-calendar-execution',version:1,executed:true,calendarAdvanced:true,
  eventsProcessed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false,
  fromDate:plan.fromDate,toDate:plan.toDate,days:1,calendar:advancementResult.calendar,dueEvents:plan.dueEvents,
  phaseChanges:plan.phaseChanges,plan,authorization,advancementResult});
}
module.exports={executeIsolatedDailyTickCalendar};
