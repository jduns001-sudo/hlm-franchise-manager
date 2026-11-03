'use strict';
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
const perDay=r=>{const m=new Map();for(const g of r)m.set(g.date,(m.get(g.date)||0)+1);return [...m.values()];};
const sd=v=>{const m=v.reduce((a,b)=>a+b,0)/v.length;return Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/v.length);};
const b2bTotal=r=>{const t=new Map();for(const g of r)for(const id of [g.homeTeamId,g.awayTeamId]){if(!t.has(id))t.set(id,[]);t.get(id).push(Date.parse(g.date));}
  let n=0;for(const x of t.values()){x.sort((a,b)=>a-b);for(let i=1;i<x.length;i++)if(x[i]-x[i-1]===86400000)n++;}return n;};

const result=run({});
const audit=auditNhl84CalendarRealism(result);
ok(teams.length===32,'32 teams');
ok(result.length===1344,'1344 games');
ok(new Set(result.map(g=>g.id)).size===1344,'unique ids');
ok(result.every((g,i)=>g.id===games[i].id&&g.status==='scheduled'),'identity and status preserved');
ok(result.every((g,i)=>g.homeTeamId===games[i].homeTeamId&&g.awayTeamId===games[i].awayTeamId),'home/away preserved');
ok(validateNhl84Schedule(teams,result).valid,'84/team, 42 home/away, matchup quotas');
ok(result.every(g=>g.date>=opts.startDate&&g.date<=opts.endDate),'date bounds');
ok(Object.keys(audit.months).join()==='2026-10,2026-11,2026-12,2027-01,2027-02,2027-03,2027-04','October-April coverage');
ok(audit.months['2027-04']>=60,'April coverage');
const used=new Map();
for(const g of result){
  if(!used.has(g.date))used.set(g.date,new Set());
  const u=used.get(g.date);
  ok(!u.has(String(g.homeTeamId))&&!u.has(String(g.awayTeamId)),'no double booking');
  u.add(String(g.homeTeamId));u.add(String(g.awayTeamId));
}
ok(audit.tripleRuns===0,'no three consecutive game days');
ok(audit.maxInactiveGap<=7,'inactivity safeguard');
ok(audit.maxBackToBacks<=6,'hard back-to-back cap');
ok(audit.maxGamesInDay<=14,'daily cap');

// daily volume variation
const v=perDay(result);
ok(Math.max(...v)-Math.min(...v)>=3,'daily volume varies');
ok(sd(v)>sd(perDay(run({volumeVariation:0}))),'variation increases spread over flat pattern');
ok(Math.max(...perDay(run({volumeVariation:0})))-Math.min(...perDay(run({volumeVariation:0})))<=2,'zero variation is near flat');
ok(Math.min(...v)>=2,'minimum daily volume honored');
const capped=run({maxGamesPerDay:9});
ok(Math.max(...perDay(capped))<=9,'custom daily cap honored');
ok(validateNhl84Schedule(teams,capped).valid,'custom cap keeps quotas');

// configurable back-to-back targets
const low=run({backToBackTarget:0}),mid=run({backToBackTarget:3}),high=run({backToBackTarget:8,maxBackToBacks:12});
ok(b2bTotal(low)<b2bTotal(mid)&&b2bTotal(mid)<b2bTotal(high),'higher target gives more back-to-backs');
ok(b2bTotal(high)>=100,'high target yields many back-to-backs');
ok(auditNhl84CalendarRealism(high).maxBackToBacks<=12,'high target respects its cap');
ok(auditNhl84CalendarRealism(high).tripleRuns===0,'high target keeps no triples');
const tight=run({backToBackTarget:1,maxBackToBacks:2});
ok(auditNhl84CalendarRealism(tight).maxBackToBacks<=2,'tight cap hard');
const short=run({maxInactiveDays:5});
ok(auditNhl84CalendarRealism(short).maxInactiveGap<=5,'tighter inactivity honored');

// blocked dates
const blockedDates=['2026-12-24','2026-12-25','2027-02-10'];
const bl=run({blockedDates});
ok(bl.every(g=>!blockedDates.includes(g.date)),'blocked dates avoided');
ok(validateNhl84Schedule(teams,bl).valid,'blocked-date schedule valid');

// determinism and immutability
ok(JSON.stringify(result)===JSON.stringify(run({})),'deterministic');
ok(JSON.stringify(result)===JSON.stringify(scheduleNhl84CalendarPattern(teams,[...games].reverse(),opts)),'order independent');
ok(JSON.stringify({teams,games})===before,'no input mutation');

// fail closed
rejects(()=>run({backToBackTarget:5,maxBackToBacks:4}),/backToBackTarget/);
rejects(()=>run({volumeVariation:2}),/volumeVariation/);
rejects(()=>run({volumeVariation:'x'}),/volumeVariation/);
rejects(()=>run({maxGamesPerDay:3}),/maxGamesPerDay/);
rejects(()=>run({minGamesPerDay:20}),/minGamesPerDay/);
rejects(()=>run({maxInactiveDays:2}),/maxInactiveDays/);
rejects(()=>run({blockedDates:'x'}),/blockedDates/);
rejects(()=>run({endDate:'2027-03-30'}),/October through April/);
rejects(()=>run({startDate:'2026-02-30'}),/Invalid calendar date/);
rejects(()=>scheduleNhl84CalendarPattern(teams,games.slice(1),opts),/Invalid NHL84/);
rejects(()=>run({blockedDates:Array.from({length:150},(_,i)=>new Date(Date.parse(opts.startDate)+i*86400000).toISOString().slice(0,10))}),/infeasible/);
ok(JSON.stringify({teams,games})===before,'no mutation after failures');
console.log('PASS '+count+' assertions; games='+result.length+'; dailyRange='+Math.min(...v)+'-'+Math.max(...v)+'; b2bLeague='+b2bTotal(result)+'; maxGap='+audit.maxInactiveGap);
