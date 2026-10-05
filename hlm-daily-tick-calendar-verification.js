'use strict';

/**
 * Phase 3 Mission 192: independent daily tick calendar execution verification.
 * Read-only verification of the exact Mission 189/190/191 chain.
 */
const {assertDailyTickAuthorized}=require('./hlm-daily-tick-authorization');
const {verifyCalendarAdvancement}=require('./hlm-calendar-advancement-verification');

function verificationError(message){const error=new Error(message);error.code='DAILY_TICK_CALENDAR_VERIFICATION_FAILED';return error;}

function verifyDailyTickCalendarExecution(input={}){
 const plan=input.plan,authorization=input.authorization,result=input.result,sourceCalendar=input.sourceCalendar;
 try{assertDailyTickAuthorized(plan,authorization);}
 catch(_){throw verificationError('Daily tick authorization does not match the exact plan.');}
 if(!sourceCalendar||sourceCalendar.kind!=='master-hockey-calendar'||sourceCalendar.currentDate!==plan.fromDate)
  throw verificationError('The original source calendar must remain at the daily tick start date.');
 if(!result||result.kind!=='isolated-daily-tick-calendar-execution'||result.version!==1||
 result.executed!==true||result.calendarAdvanced!==true||result.eventsProcessed!==false||
 result.gameSimulationPerformed!==false||result.universeSystemsProcessed!==false||result.persistencePerformed!==false||
 !result.calendar||result.calendar.kind!=='master-hockey-calendar'||!result.advancementResult)
  throw verificationError('A valid Mission 191 isolated daily tick execution is required.');
 if(result.plan!==plan||result.authorization!==authorization||result.fromDate!==plan.fromDate||
 result.toDate!==plan.toDate||result.days!==1||result.calendar.currentDate!==plan.toDate||
 result.dueEvents!==plan.dueEvents||result.phaseChanges!==plan.phaseChanges)
  throw verificationError('Daily tick execution does not match the exact authorized plan.');

 let advancementVerification;
 try{advancementVerification=verifyCalendarAdvancement({
  plan:plan.calendarPlan,authorization:authorization.calendarAuthorization,result:result.advancementResult
 });}catch(_){throw verificationError('Underlying one-day calendar advancement could not be independently verified.');}
 if(advancementVerification.days!==1||advancementVerification.toDate!==plan.toDate||
 advancementVerification.result.calendar!==result.calendar)
  throw verificationError('Underlying verified calendar does not match the daily tick result.');

 return Object.freeze({
  kind:'daily-tick-calendar-execution-verification',version:1,verified:true,
  exactlyOneDayAdvanced:true,sourceCalendarUnchanged:true,eventsUnprocessed:true,
  gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false,lineageIntact:true,
  fromDate:plan.fromDate,toDate:plan.toDate,days:1,plan,authorization,result,
  advancementVerification,calendar:result.calendar,dueEvents:plan.dueEvents,phaseChanges:plan.phaseChanges
 });
}
module.exports={verifyDailyTickCalendarExecution};
