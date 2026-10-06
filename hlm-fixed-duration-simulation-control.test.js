'use strict';
const assert=require('assert');const {createMasterCalendar}=require('./hlm-master-calendar');const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');const {createCalendarEvent,createCalendarEventIndex}=require('./hlm-calendar-event');
const {FIXED_DURATION_SIMULATION_MODES,createFixedDurationSimulationPlan,createFixedDurationSimulationAuthorization,executeFixedDurationSimulationCalendar,verifyFixedDurationSimulationCalendar}=require('./hlm-fixed-duration-simulation-control');
const timeline=createSeasonPhaseTimeline({seasonYear:2027,windows:[{id:'regular',name:'Regular Season',startDate:'2027-04-01',endDate:'2027-05-31'}]});
const event=createCalendarEvent({id:'evt-1',type:'game',date:'2027-04-20',important:true});const eventIndex=createCalendarEventIndex([event]);
for(const [mode,days] of Object.entries(FIXED_DURATION_SIMULATION_MODES)){
 const calendar=createMasterCalendar({currentDate:'2027-04-17'});const plan=createFixedDurationSimulationPlan({mode,calendar,timeline,eventIndex});
 assert.strictEqual(plan.days,days);assert.strictEqual(plan.crossedDates.length,days);assert.strictEqual(plan.processing.gameSimulationPerformed,false);
 const authorization=createFixedDurationSimulationAuthorization({plan,approved:true});const execution=executeFixedDurationSimulationCalendar({calendar,plan,authorization});
 const verification=verifyFixedDurationSimulationCalendar({execution});assert.strictEqual(verification.verified,true);assert.strictEqual(verification.days,days);
 assert.strictEqual(verification.eventsUnprocessed,true);assert.strictEqual(verification.gameSimulationPerformed,false);assert.strictEqual(calendar.currentDate,'2027-04-17');
 assert.strictEqual(Object.isFrozen(plan),true);assert.strictEqual(Object.isFrozen(authorization),true);assert.strictEqual(Object.isFrozen(execution),true);assert.strictEqual(Object.isFrozen(verification),true);
}
{const calendar=createMasterCalendar({currentDate:'2027-04-17'});assert.throws(()=>createFixedDurationSimulationPlan({mode:'season',calendar,timeline,eventIndex}),e=>e.code==='INVALID_FIXED_DURATION_SIMULATION_MODE');}
{const calendar=createMasterCalendar({currentDate:'2027-04-17'});const plan=createFixedDurationSimulationPlan({mode:'week',calendar,timeline,eventIndex});
 assert.throws(()=>createFixedDurationSimulationAuthorization({plan,approved:false}),e=>e.code==='FIXED_DURATION_SIMULATION_NOT_APPROVED');}
console.log('Fixed-duration simulation control tests passed.');
