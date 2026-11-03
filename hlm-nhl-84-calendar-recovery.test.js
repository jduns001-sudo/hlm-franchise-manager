'use strict';
// R2-RULES-07R: bounded deterministic recovery for zero-back-to-back and target-equals-cap cases.
const assert=require('node:assert/strict');
const {generateNhl84Schedule}=require('./hlm-nhl-84-schedule-generator');
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
const {auditNhl84CalendarRealism}=require('./hlm-nhl-84-calendar-realism');
const {scheduleNhl84CalendarPattern}=require('./hlm-nhl-84-calendar-pattern');
let count=0;
const ok=(v,m)=>{assert.ok(v,m);count++;};
const rejects=(fn,p)=>{assert.throws(fn,p);count++;};
const teams=[];
for(let c=0;c<2;c++)for(let d=0;d<2;d++)for(let i=0;i<8;i++)teams.push({id:`${c}-${d}-${i}`,conferenceId:`C${c}`,divisionId:`C${c}D${d}`});
const games=generateNhl84Schedule(teams),before=JSON.stringify({teams,games});
const opts={startDate:'2026-10-01',endDate:'2027-04-15'};
const run=o=>scheduleNhl84CalendarPattern(teams,games,{...opts,...o});

function auditAll(r,o){
  const {maxGamesPerDay=14,maxBackToBacks=6,maxInactiveDays=7,blockedDates=[]}=o;
  const a=auditNhl84CalendarRealism(r);
  ok(r.length===1344,'1344 games');
  ok(validateNhl84Schedule(teams,r).valid,'84 per team and matchup totals');
  ok(r.every((g,i)=>g.id===games[i].id&&g.homeTeamId===games[i].homeTeamId&&g.awayTeamId===games[i].awayTeamId&&g.status==='scheduled'),'metadata preserved');
  ok(r.every(g=>g.date>=opts.startDate&&g.date<=opts.endDate&&!blockedDates.includes(g.date)),'bounds and blocked dates');
  ok(Object.keys(a.months).join()==='2026-10,2026-11,2026-12,2027-01,2027-02,2027-03,2027-04','October-April coverage');
  ok(a.maxBackToBacks<=maxBackToBacks,'b2b cap');
  ok(a.tripleRuns===0,'no triples');
  ok(a.maxInactiveGap<=maxInactiveDays,'inactivity cap');
  ok(a.maxGamesInDay<=maxGamesPerDay,'daily cap');
  const used=new Map();
  for(const g of r){
    if(!used.has(g.date))used.set(g.date,new Set());
    const u=used.get(g.date);
    ok(!u.has(String(g.homeTeamId))&&!u.has(String(g.awayTeamId)),'no double booking');
    u.add(String(g.homeTeamId));u.add(String(g.awayTeamId));
  }
  return a;
}

// Previously failing feasible cases (baseline left 3-21 games unassigned)
const feasible={
  zero:{backToBackTarget:0,maxBackToBacks:0},
  zeroCap8:{backToBackTarget:0,maxBackToBacks:0,maxGamesPerDay:8},
  zeroBlocked:{backToBackTarget:0,maxBackToBacks:0,blockedDates:['2026-12-24','2026-12-25']},
  eq1:{backToBackTarget:1,maxBackToBacks:1},
  eq2:{backToBackTarget:2,maxBackToBacks:2},
  eq3:{backToBackTarget:3,maxBackToBacks:3},
  eq2cap9:{backToBackTarget:2,maxBackToBacks:2,maxGamesPerDay:9},
  zeroInact5:{backToBackTarget:0,maxBackToBacks:0,maxInactiveDays:5},
  zeroInact4Cap8:{backToBackTarget:0,maxBackToBacks:0,maxInactiveDays:4,maxGamesPerDay:8}
};
for(const [name,o] of Object.entries(feasible)){
  const r=run(o),a=auditAll(r,o);
  ok(JSON.stringify(r)===JSON.stringify(run(o)),name+' deterministic');
  ok(JSON.stringify(r)===JSON.stringify(scheduleNhl84CalendarPattern(teams,[...games].reverse(),{...opts,...o})),name+' order independent');
  if(o.maxBackToBacks===0)ok(a.maxBackToBacks===0,name+' truly zero back-to-backs');
}

// Cases that already worked keep their exact original path (first attempt unchanged)
ok(JSON.stringify(run({}))===JSON.stringify(run({backToBackTarget:3,maxBackToBacks:6})),'defaults stable');
auditAll(run({}),{});

// Provably infeasible cases fail closed without relaxing caps
rejects(()=>run({blockedDates:Array.from({length:150},(_,i)=>new Date(Date.parse(opts.startDate)+i*86400000).toISOString().slice(0,10))}),/capacity/);
rejects(()=>scheduleNhl84CalendarPattern(teams,games,{startDate:'2026-10-01',endDate:'2027-03-31'}),/October through April/);
rejects(()=>run({blockedDates:Array.from({length:100},(_,i)=>new Date(Date.parse(opts.startDate)+i*86400000).toISOString().slice(0,10)),maxGamesPerDay:8}),/capacity/);
// Not provable by arithmetic, but unsolvable: a 7-day interior blocked run forces an 8-day gap. Fails closed after the bounded ladder
const day=i=>new Date(Date.parse(opts.startDate)+i*86400000).toISOString().slice(0,10);
rejects(()=>run({blockedDates:Array.from({length:7},(_,i)=>day(60+i))}),/infeasible.*recovery exhausted after 9 attempts/);
rejects(()=>run({backToBackTarget:0,maxBackToBacks:0,blockedDates:Array.from({length:60},(_,i)=>day(30+i))}),/games unassigned.*recovery exhausted/);
ok(JSON.stringify({teams,games})===before,'no input mutation');
console.log('PASS '+count+' assertions');
