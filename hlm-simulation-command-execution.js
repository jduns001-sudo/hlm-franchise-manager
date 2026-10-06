'use strict';
const {createCalendarAdvancementAuthorization}=require('./hlm-calendar-advancement-authorization');
const {executeIsolatedCalendarAdvancement}=require('./hlm-calendar-advancement-execution');
const {verifyCalendarAdvancement}=require('./hlm-calendar-advancement-verification');
function err(code,m){const e=new Error(m);e.code=code;return e;}
function assertPlan(plan){
 if(!plan||plan.kind!=='simulation-command-plan'||plan.version!==1||!plan.command||plan.command.kind!=='simulation-command'||
 !plan.calendarPlan||plan.days!==plan.calendarPlan.days||plan.fromDate!==plan.calendarPlan.fromDate||plan.toDate!==plan.calendarPlan.toDate)
  throw err('INVALID_SIMULATION_COMMAND_EXECUTION','Valid unified simulation command plan required.');
 return plan;
}
function authorizeSimulationCommand({plan,approved}={}){
 assertPlan(plan);if(approved!==true)throw err('SIMULATION_COMMAND_NOT_APPROVED','Simulation command requires explicit approval.');
 const calendarAuthorization=createCalendarAdvancementAuthorization({plan:plan.calendarPlan,approved:true});
 return Object.freeze({kind:'simulation-command-authorization',version:1,approved:true,mode:plan.mode,days:plan.days,fromDate:plan.fromDate,toDate:plan.toDate,plan,calendarAuthorization});
}
function executeSimulationCommandCalendar({calendar,plan,authorization}={}){
 assertPlan(plan);
 if(!authorization||authorization.kind!=='simulation-command-authorization'||authorization.version!==1||authorization.approved!==true||
 authorization.plan!==plan||authorization.mode!==plan.mode||authorization.days!==plan.days||authorization.fromDate!==plan.fromDate||authorization.toDate!==plan.toDate)
  throw err('SIMULATION_COMMAND_AUTHORIZATION_MISMATCH','Authorization must match exact unified simulation command plan.');
 const result=executeIsolatedCalendarAdvancement({calendar,plan:plan.calendarPlan,authorization:authorization.calendarAuthorization});
 return Object.freeze({kind:'simulation-command-calendar-execution',version:1,executed:true,mode:plan.mode,days:plan.days,fromDate:plan.fromDate,toDate:plan.toDate,
 plan,authorization,result,calendar:result.calendar,dueEvents:result.dueEvents,phaseChanges:result.phaseChanges,
 targetEvent:plan.targetEvent,targetGame:plan.targetGame,stopEvent:plan.stopEvent,stoppedEarly:plan.stoppedEarly,notifications:plan.notifications,
 eventExecutionPerformed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
}
function verifySimulationCommandCalendar({execution}={}){
 if(!execution||execution.kind!=='simulation-command-calendar-execution'||execution.version!==1||execution.executed!==true)throw err('SIMULATION_COMMAND_VERIFICATION_FAILED','Valid unified simulation execution required.');
 const {plan,authorization,result}=execution;assertPlan(plan);
 if(authorization?.plan!==plan||execution.mode!==plan.mode||execution.days!==plan.days||execution.fromDate!==plan.fromDate||execution.toDate!==plan.toDate||
 execution.eventExecutionPerformed||execution.gameSimulationPerformed||execution.universeSystemsProcessed||execution.persistencePerformed)
  throw err('SIMULATION_COMMAND_VERIFICATION_FAILED','Execution does not preserve the authorized command boundary.');
 let calendarVerification;try{calendarVerification=verifyCalendarAdvancement({plan:plan.calendarPlan,authorization:authorization.calendarAuthorization,result});}
 catch(_){throw err('SIMULATION_COMMAND_VERIFICATION_FAILED','Calendar execution failed independent verification.');}
 return Object.freeze({kind:'simulation-command-calendar-verification',version:1,verified:true,mode:plan.mode,days:plan.days,fromDate:plan.fromDate,toDate:plan.toDate,
 plan,authorization,execution,calendarVerification,eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
}
module.exports={authorizeSimulationCommand,executeSimulationCommandCalendar,verifySimulationCommandCalendar};