'use strict';
const assert=require('assert');const {createMasterCalendar}=require('./hlm-master-calendar');const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');const {createCalendarEventIndex}=require('./hlm-calendar-event');const {createSimulationStopRules}=require('./hlm-simulation-stop-rules');
const {SIMULATION_COMMANDS,createSimulationCommand,planSimulationCommand}=require('./hlm-simulation-command');
const {authorizeSimulationCommand,executeSimulationCommandCalendar,verifySimulationCommandCalendar}=require('./hlm-simulation-command-execution');
function fixture(){return {calendar:createMasterCalendar({currentDate:'2027-04-17'}),timeline:createSeasonPhaseTimeline({windows:[{phaseId:'regular-season',startDate:'2027-04-01',endDate:'2027-04-30'},{phaseId:'playoffs',startDate:'2027-05-01',endDate:'2027-05-31'}]}),eventIndex:createCalendarEventIndex({events:[{id:'news',type:'news',date:'2027-04-18'},{id:'game-1',type:'game',date:'2027-04-20',important:true},{id:'award',type:'award',date:'2027-05-31'}]}),stopRules:createSimulationStopRules({behaviors:{important:'notify'}})};}
for(const mode of SIMULATION_COMMANDS){const f=fixture(),command=createSimulationCommand({command:mode}),plan=planSimulationCommand({...f,command});
 const authorization=authorizeSimulationCommand({plan,approved:true});const execution=executeSimulationCommandCalendar({calendar:f.calendar,plan,authorization});const verification=verifySimulationCommandCalendar({execution});
 assert.strictEqual(authorization.plan,plan);assert.strictEqual(execution.calendar.currentDate,plan.toDate);assert.strictEqual(verification.verified,true);
 assert.strictEqual(verification.mode,mode);assert.strictEqual(verification.eventsUnprocessed,true);assert.strictEqual(f.calendar.currentDate,'2027-04-17');
 for(const x of [authorization,execution,verification])assert.strictEqual(Object.isFrozen(x),true);}
{const f=fixture(),plan=planSimulationCommand({...f,command:createSimulationCommand({command:'week'})});
 assert.throws(()=>authorizeSimulationCommand({plan,approved:false}),e=>e.code==='SIMULATION_COMMAND_NOT_APPROVED');}
{const f=fixture(),p1=planSimulationCommand({...f,command:createSimulationCommand({command:'day'})}),p2=planSimulationCommand({...f,command:createSimulationCommand({command:'threeDays'})});
 const a=authorizeSimulationCommand({plan:p1,approved:true});assert.throws(()=>executeSimulationCommandCalendar({calendar:f.calendar,plan:p2,authorization:a}),e=>e.code==='SIMULATION_COMMAND_AUTHORIZATION_MISMATCH');}
console.log('Unified simulation command execution tests passed.');