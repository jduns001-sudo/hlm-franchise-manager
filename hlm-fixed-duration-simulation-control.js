'use strict';
const {createCalendarAdvancementPlan}=require('./hlm-calendar-advancement-plan');
const {createCalendarAdvancementAuthorization}=require('./hlm-calendar-advancement-authorization');
const {executeIsolatedCalendarAdvancement}=require('./hlm-calendar-advancement-execution');
const {verifyCalendarAdvancement}=require('./hlm-calendar-advancement-verification');
const MODES=Object.freeze({threeDays:3,week:7,month:30});
function modeError(m){const e=new Error(m);e.code='INVALID_FIXED_DURATION_SIMULATION_MODE';return e;}
function assertMode(mode){if(!Object.prototype.hasOwnProperty.call(MODES,mode))throw modeError('Mode must be threeDays, week, or month.');return MODES[mode];}
function createFixedDurationSimulationPlan(input={}){
 const days=assertMode(input.mode),calendarPlan=createCalendarAdvancementPlan({...input,days});
 return Object.freeze({kind:'fixed-duration-simulation-plan',version:1,mode:input.mode,days,fromDate:calendarPlan.fromDate,toDate:calendarPlan.toDate,
 crossedDates:calendarPlan.crossedDates,phaseChanges:calendarPlan.phaseChanges,dueEvents:calendarPlan.dueEvents,calendarPlan,
 processing:Object.freeze({calendarRequired:true,dueEventsDiscovered:calendarPlan.dueEvents.length>0,eventExecutionPerformed:false,
 gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false})});
}
function createFixedDurationSimulationAuthorization({plan,approved}={}){
 if(!plan||plan.kind!=='fixed-duration-simulation-plan'||plan.days!==assertMode(plan.mode)||plan.calendarPlan?.days!==plan.days)throw modeError('Valid fixed-duration plan required.');
 if(approved!==true){const e=new Error('Explicit fixed-duration simulation approval required.');e.code='FIXED_DURATION_SIMULATION_NOT_APPROVED';throw e;}
 const calendarAuthorization=createCalendarAdvancementAuthorization({plan:plan.calendarPlan,approved:true});
 return Object.freeze({kind:'fixed-duration-simulation-authorization',version:1,approved:true,mode:plan.mode,days:plan.days,plan,calendarAuthorization});
}
function executeFixedDurationSimulationCalendar({calendar,plan,authorization}={}){
 if(!authorization||authorization.kind!=='fixed-duration-simulation-authorization'||authorization.approved!==true||authorization.plan!==plan||
 authorization.mode!==plan?.mode||authorization.days!==plan?.days)throw modeError('Authorization must match exact fixed-duration plan.');
 const result=executeIsolatedCalendarAdvancement({calendar,plan:plan.calendarPlan,authorization:authorization.calendarAuthorization});
 return Object.freeze({kind:'fixed-duration-simulation-calendar-execution',version:1,executed:true,mode:plan.mode,days:plan.days,
 fromDate:plan.fromDate,toDate:plan.toDate,plan,authorization,result,calendar:result.calendar,dueEvents:result.dueEvents,phaseChanges:result.phaseChanges,
 eventExecutionPerformed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
}
function verifyFixedDurationSimulationCalendar({execution}={}){
 if(!execution||execution.kind!=='fixed-duration-simulation-calendar-execution'||execution.executed!==true||
 execution.days!==assertMode(execution.mode)||execution.authorization?.plan!==execution.plan||execution.plan.mode!==execution.mode)throw modeError('Valid fixed-duration execution required.');
 const calendarVerification=verifyCalendarAdvancement({plan:execution.plan.calendarPlan,authorization:execution.authorization.calendarAuthorization,result:execution.result});
 if(execution.eventExecutionPerformed||execution.gameSimulationPerformed||execution.universeSystemsProcessed||execution.persistencePerformed)throw modeError('Fixed-duration calendar control must remain isolated.');
 return Object.freeze({kind:'fixed-duration-simulation-calendar-verification',version:1,verified:true,mode:execution.mode,days:execution.days,
 fromDate:execution.fromDate,toDate:execution.toDate,plan:execution.plan,authorization:execution.authorization,execution,calendarVerification,
 eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false});
}
module.exports={FIXED_DURATION_SIMULATION_MODES:MODES,createFixedDurationSimulationPlan,createFixedDurationSimulationAuthorization,executeFixedDurationSimulationCalendar,verifyFixedDurationSimulationCalendar};
