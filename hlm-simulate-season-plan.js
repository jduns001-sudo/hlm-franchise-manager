'use strict';
const {createCalendarAdvancementPlan}=require('./hlm-calendar-advancement-plan');
const {resolveSimulationEventBehavior}=require('./hlm-simulation-stop-rules');
function seasonError(m){const e=new Error(m);e.code='INVALID_SIMULATE_SEASON_PLAN';return e;}
function priorityOf(event){if(event.priority)return event.priority;if(event.important===true)return 'important';return 'informational';}
function createSimulateSeasonPlan(input={}){
 const {calendar,timeline,eventIndex,stopRules}=input;
 if(!timeline||timeline.kind!=='season-phase-timeline'||!Array.isArray(timeline.windows)||timeline.windows.length===0)throw seasonError('Season phase timeline required.');
 if(!eventIndex||eventIndex.kind!=='calendar-event-index'||!Array.isArray(eventIndex.events))throw seasonError('Calendar event index required.');
 const futureWindows=timeline.windows.filter(w=>w.endDate>calendar?.currentDate);if(!futureWindows.length)throw seasonError('No future season boundary available.');
 const seasonEndDate=futureWindows[futureWindows.length-1].endDate;
 const start=new Date(calendar.currentDate+'T00:00:00Z'),end=new Date(seasonEndDate+'T00:00:00Z');
 const maximumDays=Math.round((end-start)/86400000);if(maximumDays<1)throw seasonError('Season end must be in the future.');
 const interruptEvent=eventIndex.events.find(event=>event.date>calendar.currentDate&&event.date<=seasonEndDate&&resolveSimulationEventBehavior(stopRules,priorityOf(event))==='interrupt')||null;
 const targetDate=interruptEvent?interruptEvent.date:seasonEndDate,target=new Date(targetDate+'T00:00:00Z'),days=Math.round((target-start)/86400000);
 const calendarPlan=createCalendarAdvancementPlan({calendar,timeline,eventIndex,days});
 const notifications=Object.freeze(calendarPlan.dueEvents.filter(e=>resolveSimulationEventBehavior(stopRules,priorityOf(e))==='notify'));
 return Object.freeze({kind:'simulate-season-plan',version:1,fromDate:calendar.currentDate,seasonEndDate,targetDate,days,maximumDays,
 stoppedEarly:!!interruptEvent,stopEvent:interruptEvent,notifications,calendarPlan,phaseChanges:calendarPlan.phaseChanges,dueEvents:calendarPlan.dueEvents,
 processing:Object.freeze({eventExecutionPerformed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false})});
}
module.exports={createSimulateSeasonPlan};