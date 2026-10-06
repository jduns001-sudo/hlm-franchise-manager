'use strict';
const {createDailyTickPlan}=require('./hlm-daily-tick-plan');
const {createNextGameCalendarAdvancementPlan}=require('./hlm-calendar-next-game-advancement-plan');
const {createNextEventCalendarAdvancementPlan}=require('./hlm-calendar-next-event-advancement-plan');
const {createFixedDurationSimulationPlan}=require('./hlm-fixed-duration-simulation-control');
const {createSimulateSeasonPlan}=require('./hlm-simulate-season-plan');
const COMMANDS=Object.freeze(['day','threeDays','week','month','nextGame','nextEvent','season']);
function commandError(m){const e=new Error(m);e.code='INVALID_SIMULATION_COMMAND';return e;}
function createSimulationCommand(input={}){
 if(!COMMANDS.includes(input.command))throw commandError('Unknown simulation command.');
 return Object.freeze({kind:'simulation-command',version:1,command:input.command,importantOnly:input.importantOnly===true});
}
function planSimulationCommand(input={}){
 const command=input.command;
 if(!command||command.kind!=='simulation-command'||command.version!==1||!COMMANDS.includes(command.command))throw commandError('Valid simulation command required.');
 const shared={calendar:input.calendar,timeline:input.timeline,eventIndex:input.eventIndex};
 let plan;
 switch(command.command){
  case 'day':plan=createDailyTickPlan(shared);break;
  case 'threeDays':case 'week':case 'month':plan=createFixedDurationSimulationPlan({...shared,mode:command.command});break;
  case 'nextGame':plan=createNextGameCalendarAdvancementPlan(shared);break;
  case 'nextEvent':plan=createNextEventCalendarAdvancementPlan({...shared,importantOnly:command.importantOnly});break;
  case 'season':plan=createSimulateSeasonPlan({...shared,stopRules:input.stopRules});break;
 }
 const calendarPlan=plan.calendarPlan||plan.advancement;
 if(!calendarPlan||typeof calendarPlan.days!=='number')throw commandError('Simulation command did not produce a calendar plan.');
 return Object.freeze({kind:'simulation-command-plan',version:1,command,mode:command.command,days:calendarPlan.days,
  fromDate:calendarPlan.fromDate,toDate:calendarPlan.toDate,plan,calendarPlan,
  targetEvent:plan.targetEvent||null,targetGame:plan.targetGame||null,stopEvent:plan.stopEvent||null,
  stoppedEarly:plan.stoppedEarly===true,notifications:plan.notifications||Object.freeze([]),
  dueEvents:calendarPlan.dueEvents,phaseChanges:calendarPlan.phaseChanges,
  processing:Object.freeze({eventExecutionPerformed:false,gameSimulationPerformed:false,universeSystemsProcessed:false,persistencePerformed:false})});
}
module.exports={SIMULATION_COMMANDS:COMMANDS,createSimulationCommand,planSimulationCommand};