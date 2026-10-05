'use strict';

/**
 * Phase 3 Mission 190: daily tick authorization.
 * Permission boundary only. Binds explicit approval to one exact Mission 189
 * plan and its underlying one-day calendar advancement plan.
 * Does not advance time, process events, simulate games, persist, or touch UI.
 */
const {createCalendarAdvancementAuthorization,assertCalendarAdvancementAuthorized}=require('./hlm-calendar-advancement-authorization');

function authorizationError(message){const error=new Error(message);error.code='DAILY_TICK_NOT_AUTHORIZED';return error;}

function assertDailyTickPlan(plan){
 if(!plan||plan.kind!=='daily-tick-plan'||plan.version!==1||plan.days!==1||
 typeof plan.fromDate!=='string'||typeof plan.toDate!=='string'||
 !Array.isArray(plan.phaseChanges)||!Array.isArray(plan.dueEvents)||
 !plan.calendarPlan||plan.calendarPlan.kind!=='calendar-advancement-plan'||plan.calendarPlan.version!==1||
 plan.calendarPlan.days!==1||plan.fromDate!==plan.calendarPlan.fromDate||plan.toDate!==plan.calendarPlan.toDate||
 plan.phaseChanges!==plan.calendarPlan.phaseChanges||plan.dueEvents!==plan.calendarPlan.dueEvents||
 !plan.processing||plan.processing.calendarAdvancementRequired!==true||
 plan.processing.gameSimulationPerformed!==false||plan.processing.universeSystemsProcessed!==false||
 plan.processing.persistencePerformed!==false)
  throw authorizationError('A valid exact Mission 189 daily tick plan is required.');
 return plan;
}

function createDailyTickAuthorization(input={}){
 const plan=assertDailyTickPlan(input.plan);
 if(input.approved!==true)throw authorizationError('Daily tick requires explicit approval.');
 const calendarAuthorization=createCalendarAdvancementAuthorization({plan:plan.calendarPlan,approved:true});
 return Object.freeze({kind:'daily-tick-authorization',version:1,approved:true,executed:false,
  fromDate:plan.fromDate,toDate:plan.toDate,days:1,plan,calendarAuthorization});
}

function assertDailyTickAuthorized(plan,authorization){
 const validatedPlan=assertDailyTickPlan(plan);
 if(!authorization||authorization.kind!=='daily-tick-authorization'||authorization.version!==1||
 authorization.approved!==true||authorization.executed!==false||authorization.plan!==validatedPlan||
 authorization.fromDate!==validatedPlan.fromDate||authorization.toDate!==validatedPlan.toDate||
 authorization.days!==1||!authorization.calendarAuthorization)
  throw authorizationError('Authorization does not match the exact daily tick plan.');
 try{assertCalendarAdvancementAuthorized(validatedPlan.calendarPlan,authorization.calendarAuthorization);}
 catch(_){throw authorizationError('Underlying one-day calendar advancement authorization is invalid.');}
 return true;
}

module.exports={createDailyTickAuthorization,assertDailyTickAuthorized};
