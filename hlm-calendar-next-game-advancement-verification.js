'use strict';

/**
 * Phase 3 Mission 160: independent next-game calendar advancement verification.
 * Verifies the exact Mission 157/158/159 chain without advancing again,
 * mutating GameState, touching persistence, simulating a game, or wiring UI.
 */
const {assertNextGameCalendarAdvancementAuthorized}=require('./hlm-calendar-next-game-advancement-authorization');
const {verifyCalendarAdvancement}=require('./hlm-calendar-advancement-verification');
function verificationError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED';return error;}
function verifyNextGameCalendarAdvancement(input={}){
 const plan=input.plan,authorization=input.authorization,result=input.result;
 try{assertNextGameCalendarAdvancementAuthorized(plan,authorization);}
 catch(_){throw verificationError('Next-game authorization does not match the exact plan.');}
 if(!result||result.kind!=='isolated-next-game-calendar-advancement-result'||result.version!==1||
 result.executed!==true||!result.calendar||result.calendar.kind!=='master-hockey-calendar'||!result.advancementResult)
  throw verificationError('A valid Mission 159 isolated next-game result is required.');
 if(result.plan!==plan||result.authorization!==authorization||result.targetGame!==plan.targetGame||
 result.fromDate!==plan.fromDate||result.toDate!==plan.toDate||result.days!==plan.days||
 result.calendar.currentDate!==plan.targetGame.date||result.dueEvents!==plan.dueEvents||
 result.phaseChanges!==plan.phaseChanges)throw verificationError('Next-game execution does not match the exact authorized plan.');
 let advancementVerification;
 try{advancementVerification=verifyCalendarAdvancement({plan:plan.advancement,authorization:authorization.advancementAuthorization,result:result.advancementResult});}
 catch(_){throw verificationError('Underlying calendar advancement could not be independently verified.');}
 if(advancementVerification.toDate!==plan.toDate||advancementVerification.result.calendar!==result.calendar)
  throw verificationError('Underlying verified calendar does not match the next-game result.');
 return Object.freeze({kind:'next-game-calendar-advancement-verification',version:1,verified:true,targetGameReached:true,lineageIntact:true,
  fromDate:plan.fromDate,toDate:plan.toDate,days:plan.days,targetGame:plan.targetGame,plan,authorization,result,
  advancementVerification,calendar:result.calendar,dueEvents:plan.dueEvents,phaseChanges:plan.phaseChanges});
}
module.exports={verifyNextGameCalendarAdvancement};
