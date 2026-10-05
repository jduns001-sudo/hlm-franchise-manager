'use strict';
const assert=require('assert');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createNextGameCalendarAdvancementPlan}=require('./hlm-calendar-next-game-advancement-plan');
const {createNextGameCalendarAdvancementAuthorization,assertNextGameCalendarAdvancementAuthorized}=require('./hlm-calendar-next-game-advancement-authorization');
const calendar=createMasterCalendar({currentDate:'2027-03-03'});
const timeline=createSeasonPhaseTimeline({windows:[{phaseId:'regular-season',startDate:'2027-03-01',endDate:'2027-04-10'}]});
const eventIndex=createCalendarEventIndex({events:[
 {id:'scout',type:'scouting-update',date:'2027-03-04'},
 {id:'game',type:'game',date:'2027-03-05',important:true}
]});
const plan=createNextGameCalendarAdvancementPlan({calendar,timeline,eventIndex});
const authorization=createNextGameCalendarAdvancementAuthorization({plan,approved:true});
assert.strictEqual(authorization.kind,'next-game-calendar-advancement-authorization');assert.strictEqual(authorization.version,1);
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.plan,plan);assert.strictEqual(authorization.targetGame,plan.targetGame);
assert.strictEqual(authorization.toDate,'2027-03-05');assert.strictEqual(authorization.advancementAuthorization.plan,plan.advancement);
assert.strictEqual(Object.isFrozen(authorization),true);assert.strictEqual(assertNextGameCalendarAdvancementAuthorized(plan,authorization),true);
assert.throws(()=>createNextGameCalendarAdvancementAuthorization({plan,approved:false}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED');
assert.throws(()=>assertNextGameCalendarAdvancementAuthorized({...plan},authorization),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED');
assert.throws(()=>assertNextGameCalendarAdvancementAuthorized(plan,{...authorization,targetGame:{...plan.targetGame}}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED');
assert.throws(()=>assertNextGameCalendarAdvancementAuthorized(plan,{...authorization,advancementAuthorization:{...authorization.advancementAuthorization,plan:{...plan.advancement}}}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED');
const fake={...plan,targetGame:Object.freeze({...plan.targetGame,type:'news'})};
assert.throws(()=>createNextGameCalendarAdvancementAuthorization({plan:fake,approved:true}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_NOT_AUTHORIZED');
console.log('Next-game calendar advancement authorization tests passed.');
