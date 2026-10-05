'use strict';

/**
 * Phase 3 Mission 158: next-game calendar advancement authorization.
 * Binds one exact Mission 157 next-game plan to the existing deterministic
 * calendar advancement authorization. Performs no advancement or persistence.
 */
const {createCalendarAdvancementAuthorization,assertCalendarAdvancementAuthorized}=require('./hlm-calendar-advancement-authorization');
function authorizationError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED';return error;}
function assertNextGamePlan(plan){
 if(!plan||plan.kind!=='next-game-calendar-advancement-plan'||plan.version!==1||
 typeof plan.fromDate!=='string'||typeof plan.toDate!=='string'||!Number.isSafeInteger(plan.days)||plan.days<1||
 !plan.targetGame||plan.targetGame.kind!=='calendar-event'||plan.targetGame.type!=='game'||plan.targetGame.date!==plan.toDate||
 !plan.advancement||plan.advancement.kind!=='calendar-advancement-plan'||
 plan.fromDate!==plan.advancement.fromDate||plan.toDate!==plan.advancement.toDate||plan.days!==plan.advancement.days||
 plan.crossedDates!==plan.advancement.crossedDates||plan.phaseChanges!==plan.advancement.phaseChanges||
 plan.dueEvents!==plan.advancement.dueEvents)throw authorizationError('A valid exact Mission 157 next-game plan is required.');
 return plan;
}
function createNextGameCalendarAdvancementAuthorization(input={}){
 const plan=assertNextGamePlan(input.plan);
 if(input.approved!==true)throw authorizationError('Next-game calendar advancement requires explicit approval.');
 const advancementAuthorization=createCalendarAdvancementAuthorization({plan:plan.advancement,approved:true});
 return Object.freeze({kind:'next-game-calendar-advancement-authorization',version:1,approved:true,
  fromDate:plan.fromDate,toDate:plan.toDate,days:plan.days,targetGame:plan.targetGame,plan,advancementAuthorization});
}
function assertNextGameCalendarAdvancementAuthorized(plan,authorization){
 const validatedPlan=assertNextGamePlan(plan);
 if(!authorization||authorization.kind!=='next-game-calendar-advancement-authorization'||authorization.version!==1||
 authorization.approved!==true||authorization.plan!==validatedPlan||authorization.targetGame!==validatedPlan.targetGame||
 authorization.fromDate!==validatedPlan.fromDate||authorization.toDate!==validatedPlan.toDate||
 authorization.days!==validatedPlan.days||!authorization.advancementAuthorization)
  throw authorizationError('Authorization does not match the exact next-game plan.');
 try{assertCalendarAdvancementAuthorized(validatedPlan.advancement,authorization.advancementAuthorization);}
 catch(_){throw authorizationError('Underlying calendar advancement authorization is invalid.');}
 return true;
}
module.exports={createNextGameCalendarAdvancementAuthorization,assertNextGameCalendarAdvancementAuthorized};
