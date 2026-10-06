'use strict';
const assert=require('assert');const {createMasterCalendar}=require('./hlm-master-calendar');const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createSimulationStopRules,resolveSimulationEventBehavior}=require('./hlm-simulation-stop-rules');const {createSimulateSeasonPlan}=require('./hlm-simulate-season-plan');
const calendar=createMasterCalendar({currentDate:'2027-04-17'});
const timeline=createSeasonPhaseTimeline({windows:[{phaseId:'regular-season',startDate:'2027-04-01',endDate:'2027-04-30'},{phaseId:'playoffs',startDate:'2027-05-01',endDate:'2027-05-31'}]});
const eventIndex=createCalendarEventIndex({events:[{id:'news',type:'news',date:'2027-04-18'},{id:'deadline',type:'trade-deadline',date:'2027-04-20',important:true},{id:'award',type:'award',date:'2027-05-31'}]});
{const rules=createSimulationStopRules();assert.strictEqual(resolveSimulationEventBehavior(rules,'critical'),'interrupt');assert.strictEqual(resolveSimulationEventBehavior(rules,'informational'),'notify');
 const plan=createSimulateSeasonPlan({calendar,timeline,eventIndex,stopRules:rules});assert.strictEqual(plan.stoppedEarly,true);assert.strictEqual(plan.stopEvent.id,'deadline');assert.strictEqual(plan.targetDate,'2027-04-20');
 assert.strictEqual(plan.days,3);assert.deepStrictEqual(plan.notifications.map(e=>e.id),['news']);assert.strictEqual(plan.processing.gameSimulationPerformed,false);assert.strictEqual(Object.isFrozen(plan),true);}
{const rules=createSimulationStopRules({behaviors:{important:'notify'}});const plan=createSimulateSeasonPlan({calendar,timeline,eventIndex,stopRules:rules});
 assert.strictEqual(plan.stoppedEarly,false);assert.strictEqual(plan.stopEvent,null);assert.strictEqual(plan.targetDate,'2027-05-31');assert.strictEqual(plan.days,44);
 assert.deepStrictEqual(plan.notifications.map(e=>e.id),['news','deadline','award']);}
{assert.throws(()=>createSimulationStopRules({behaviors:{critical:'ignore'}}),e=>e.code==='INVALID_SIMULATION_STOP_RULES');}
console.log('Simulation stop rules and Simulate Season planning tests passed.');