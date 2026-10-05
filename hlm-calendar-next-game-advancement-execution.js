'use strict';

/**
 * Phase 3 Mission 159: isolated next-game calendar advancement execution.
 * Executes only the calendar movement authorized by Mission 158. Produces a
 * new calendar/result only. No GameState, persistence, game simulation, or UI.
 */
const {assertNextGameCalendarAdvancementAuthorized}=require('./hlm-calendar-next-game-advancement-authorization');
const {executeIsolatedCalendarAdvancement}=require('./hlm-calendar-advancement-execution');
function executionError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_ADVANCEMENT_EXECUTION_FAILED';return error;}
function executeIsolatedNextGameCalendarAdvancement(input={}){
 const calendar=input.calendar,plan=input.plan,authorization=input.authorization;
 try{assertNextGameCalendarAdvancementAuthorized(plan,authorization);}
 catch(_){throw executionError('Next-game advancement is not authorized for the exact plan.');}
 if(!calendar||calendar.kind!=='master-hockey-calendar'||typeof calendar.currentDate!=='string')throw executionError('A master hockey calendar is required.');
 if(calendar.currentDate!==plan.fromDate)throw executionError('Source calendar date does not match the authorized next-game plan.');
 let advancementResult;
 try{advancementResult=executeIsolatedCalendarAdvancement({calendar,plan:plan.advancement,authorization:authorization.advancementAuthorization});}
 catch(_){throw executionError('Underlying isolated calendar advancement failed.');}
 if(advancementResult.toDate!==plan.toDate||advancementResult.calendar.currentDate!==plan.targetGame.date||
 advancementResult.dueEvents!==plan.dueEvents||advancementResult.phaseChanges!==plan.phaseChanges)
  throw executionError('Underlying calendar result does not match the next-game target.');
 return Object.freeze({kind:'isolated-next-game-calendar-advancement-result',version:1,executed:true,
  fromDate:plan.fromDate,toDate:plan.toDate,days:plan.days,targetGame:plan.targetGame,calendar:advancementResult.calendar,
  dueEvents:plan.dueEvents,phaseChanges:plan.phaseChanges,plan,authorization,advancementResult});
}
module.exports={executeIsolatedNextGameCalendarAdvancement};
