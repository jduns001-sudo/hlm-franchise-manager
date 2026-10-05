'use strict';
const assert=require('assert');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createNextGameCalendarAdvancementPlan}=require('./hlm-calendar-next-game-advancement-plan');
const calendar=createMasterCalendar({currentDate:'2027-03-03'});
const timeline=createSeasonPhaseTimeline({windows:[{phaseId:'regular-season',startDate:'2027-01-01',endDate:'2027-04-30'}]});
const eventIndex=createCalendarEventIndex({events:[
 {id:'news-1',type:'news',date:'2027-03-04',important:true},
 {id:'game-2',type:'game',date:'2027-03-08',important:false},
 {id:'game-1',type:'game',date:'2027-03-05',important:false},
 {id:'deadline',type:'trade-deadline',date:'2027-03-05',important:true}
]});
const r=createNextGameCalendarAdvancementPlan({calendar,timeline,eventIndex});
assert.strictEqual(r.kind,'next-game-calendar-advancement-plan');assert.strictEqual(r.version,1);
assert.strictEqual(r.fromDate,'2027-03-03');assert.strictEqual(r.toDate,'2027-03-05');assert.strictEqual(r.days,2);
assert.strictEqual(r.targetGame.id,'game-1');assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.targetGame.date,'2027-03-05');
assert.strictEqual(r.advancement.kind,'calendar-advancement-plan');assert.deepStrictEqual(r.crossedDates,['2027-03-04','2027-03-05']);
assert.deepStrictEqual(r.dueEvents.map(e=>e.id),['news-1','deadline','game-1']);assert.strictEqual(Object.isFrozen(r),true);
const sameDay=createCalendarEventIndex({events:[{id:'today',type:'game',date:'2027-03-03'},{id:'future',type:'game',date:'2027-03-06'}]});
assert.strictEqual(createNextGameCalendarAdvancementPlan({calendar,timeline,eventIndex:sameDay}).targetGame.id,'future');
const none=createCalendarEventIndex({events:[{id:'news',type:'news',date:'2027-03-04'}]});
assert.throws(()=>createNextGameCalendarAdvancementPlan({calendar,timeline,eventIndex:none}),e=>e.code==='INVALID_NEXT_GAME_CALENDAR_ADVANCEMENT_PLAN');
assert.throws(()=>createNextGameCalendarAdvancementPlan({calendar,timeline,eventIndex:{}}),e=>e.code==='INVALID_NEXT_GAME_CALENDAR_ADVANCEMENT_PLAN');
console.log('Next-game calendar advancement plan tests passed.');
