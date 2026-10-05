'use strict';

/**
 * Phase 3 Mission 189: deterministic daily tick plan.
 * Pure planning only. Defines one exact day of master-timeline work without
 * executing calendar advancement, events, game simulation, universe systems,
 * persistence, or UI behavior.
 */
const {createCalendarAdvancementPlan}=require('./hlm-calendar-advancement-plan');

function planError(message){const error=new Error(message);error.code='INVALID_DAILY_TICK_PLAN';return error;}

function createDailyTickPlan(input={}){
 let calendarPlan;
 try{calendarPlan=createCalendarAdvancementPlan({
  calendar:input.calendar,timeline:input.timeline,eventIndex:input.eventIndex,days:1
 });}catch(_){throw planError('A valid calendar, season phase timeline, and calendar event index are required.');}
 if(calendarPlan.days!==1||calendarPlan.crossedDates.length!==1||calendarPlan.crossedDates[0]!==calendarPlan.toDate)
  throw planError('Daily tick planning must represent exactly one calendar day.');
 const fromPhase=input.timeline.phaseOn(calendarPlan.fromDate);
 const toPhase=input.timeline.phaseOn(calendarPlan.toDate);
 return Object.freeze({
  kind:'daily-tick-plan',version:1,fromDate:calendarPlan.fromDate,toDate:calendarPlan.toDate,days:1,
  fromPhase,toPhase,phaseChanges:calendarPlan.phaseChanges,dueEvents:calendarPlan.dueEvents,
  calendarPlan,
  processing:Object.freeze({
   calendarAdvancementRequired:true,
   dueEventProcessingRequired:calendarPlan.dueEvents.length>0,
   gameSimulationPerformed:false,
   universeSystemsProcessed:false,
   persistencePerformed:false
  })
 });
}
module.exports={createDailyTickPlan};
