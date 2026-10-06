'use strict';
const assert=require('assert');const {createMasterCalendar}=require('./hlm-master-calendar');const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');const {createCalendarEventIndex}=require('./hlm-calendar-event');const {createSimulationStopRules}=require('./hlm-simulation-stop-rules');
const {SIMULATION_COMMANDS,createSimulationCommand,planSimulationCommand}=require('./hlm-simulation-command');
function fixture(){return {calendar:createMasterCalendar({currentDate:'2027-04-17'}),timeline:createSeasonPhaseTimeline({windows:[{phaseId:'regular-season',startDate:'2027-04-01',endDate:'2027-04-30'},{phaseId:'playoffs',startDate:'2027-05-01',endDate:'2027-05-31'}]}),eventIndex:createCalendarEventIndex({events:[{id:'news',type:'news',date:'2027-04-18'},{id:'game-1',type:'game',date:'2027-04-20',important:true},{id:'award',type:'award',date:'2027-05-31'}]}),stopRules:createSimulationStopRules({behaviors:{important:'notify'}})};}
const expected={day:1,threeDays:3,week:7,month:30,nextGame:3,nextEvent:1,season:44};
for(const mode of SIMULATION_COMMANDS){const f=fixture(),command=createSimulationCommand({command:mode});const result=planSimulationCommand({...f,command});
 assert.strictEqual(result.kind,'simulation-command-plan');assert.strictEqual(result.mode,mode);assert.strictEqual(result.days,expected[mode]);
 assert.strictEqual(result.processing.gameSimulationPerformed,false);assert.strictEqual(result.processing.universeSystemsProcessed,false);
 assert.strictEqual(result.processing.persistencePerformed,false);assert.strictEqual(f.calendar.currentDate,'2027-04-17');assert.strictEqual(Object.isFrozen(result),true);}
{const f=fixture(),command=createSimulationCommand({command:'nextEvent',importantOnly:true});const result=planSimulationCommand({...f,command});
 assert.strictEqual(result.targetEvent.id,'game-1');assert.strictEqual(result.days,3);}
assert.throws(()=>createSimulationCommand({command:'warp'}),e=>e.code==='INVALID_SIMULATION_COMMAND');
console.log('Unified simulation command tests passed.');