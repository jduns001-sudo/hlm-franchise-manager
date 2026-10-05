'use strict';

/**
 * Phase 3 Mission 157: next-game calendar advancement plan.
 * Pure planning only. Finds the next future calendar event of type "game" and
 * delegates deterministic crossing to the existing advancement planner.
 * Performs no execution, persistence, game simulation, or UI wiring.
 */
const {createCalendarAdvancementPlan}=require('./hlm-calendar-advancement-plan');
function planError(message){const error=new Error(message);error.code='INVALID_NEXT_GAME_CALENDAR_ADVANCEMENT_PLAN';return error;}
function createNextGameCalendarAdvancementPlan(input={}){
 const calendar=input.calendar,timeline=input.timeline,eventIndex=input.eventIndex;
 if(!calendar||calendar.kind!=='master-hockey-calendar'||typeof calendar.currentDate!=='string')throw planError('A master hockey calendar is required.');
 if(!timeline||timeline.kind!=='season-phase-timeline'||typeof timeline.phaseOn!=='function')throw planError('A season phase timeline is required.');
 if(!eventIndex||eventIndex.kind!=='calendar-event-index'||!Array.isArray(eventIndex.events))throw planError('A calendar event index is required.');
 const nextGame=eventIndex.events.find(event=>event.date>calendar.currentDate&&event.type==='game')||null;
 if(!nextGame)throw planError('No future game calendar event is available.');
 const from=new Date(calendar.currentDate+'T00:00:00Z'),to=new Date(nextGame.date+'T00:00:00Z');
 const days=Math.round((to.getTime()-from.getTime())/86400000);
 if(!Number.isSafeInteger(days)||days<1)throw planError('Next game must occur after the current calendar date.');
 const advancement=createCalendarAdvancementPlan({calendar,timeline,eventIndex,days});
 return Object.freeze({kind:'next-game-calendar-advancement-plan',version:1,fromDate:advancement.fromDate,toDate:advancement.toDate,
  days:advancement.days,targetGame:nextGame,crossedDates:advancement.crossedDates,phaseChanges:advancement.phaseChanges,
  dueEvents:advancement.dueEvents,advancement});
}
module.exports={createNextGameCalendarAdvancementPlan};
