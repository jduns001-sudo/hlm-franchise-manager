'use strict';
const assert=require('node:assert/strict');
const {generateNhl84Schedule}=require('./hlm-nhl-84-schedule-generator');
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
const {scheduleNhl84RealisticCalendar}=require('./hlm-nhl-84-realistic-calendar');
let count=0;
function ok(value,message){assert.ok(value,message);count++;}
function rejects(fn,pattern){assert.throws(fn,pattern);count++;}
const teams=[];
for(let c=0;c<2;c++)for(let d=0;d<2;d++)for(let i=0;i<8;i++)
  teams.push({id:`${c}-${d}-${i}`,conferenceId:`C${c}`,divisionId:`C${c}D${d}`});
const games=generateNhl84Schedule(teams),before=JSON.stringify({teams,games});
const opts={startDate:'2026-10-01',endDate:'2027-04-15'};
const result=scheduleNhl84RealisticCalendar(teams,games,opts);
ok(result.length===1344,'all games assigned');
ok(validateNhl84Schedule(teams,result).valid,'all six approved totals');
ok(result.every(g=>g.date>=opts.startDate&&g.date<=opts.endDate),'October-April boundaries');
ok(result.every(g=>g.status==='scheduled'),'statuses preserved');
ok(result.every((g,i)=>g.id===games[i].id),'game identities preserved');
const daily=new Map(),teamDates=new Map();
for(const g of result){
  if(!daily.has(g.date))daily.set(g.date,new Set());
  const used=daily.get(g.date);
  ok(!used.has(String(g.homeTeamId))&&!used.has(String(g.awayTeamId)),'no double booking');
  used.add(String(g.homeTeamId));used.add(String(g.awayTeamId));
  for(const id of [String(g.homeTeamId),String(g.awayTeamId)]){
    if(!teamDates.has(id))teamDates.set(id,[]);
    teamDates.get(id).push(g.date);
  }
}
ok([...daily.values()].every(set=>set.size<=24),'daily cap respected');
for(const dates of teamDates.values()){
  dates.sort();
  ok(dates.length===84,'84 games per team');
  for(let i=1;i<dates.length;i++){
    const gap=(Date.parse(dates[i])-Date.parse(dates[i-1]))/86400000;
    ok(gap>=2,'minimum one full rest day');
  }
}
ok(JSON.stringify({teams,games})===before,'input untouched');
ok(JSON.stringify(result)===JSON.stringify(scheduleNhl84RealisticCalendar(teams,games,opts)),'deterministic repeat');
ok(JSON.stringify(result)===JSON.stringify(scheduleNhl84RealisticCalendar(teams,[...games].reverse(),opts)),'order independent');
rejects(()=>scheduleNhl84RealisticCalendar(teams,games,{...opts,endDate:'2027-03-30'}),/October through April/);
rejects(()=>scheduleNhl84RealisticCalendar(teams,games,{...opts,startDate:'2026-02-30'}),/Invalid calendar date/);
rejects(()=>scheduleNhl84RealisticCalendar(teams,games,{...opts,maxGamesPerDay:3}),/maxGamesPerDay/);
rejects(()=>scheduleNhl84RealisticCalendar(teams,games.slice(1),opts),/Invalid NHL84/);
rejects(()=>scheduleNhl84RealisticCalendar(teams,games,{...opts,blockedDates:Array.from({length:197},(_,i)=>new Date(Date.parse(opts.startDate)+i*86400000).toISOString().slice(0,10))}),/infeasible/);
console.log('PASS '+count+' assertions; games='+result.length+'; activeDays='+daily.size);
