'use strict';
const assert=require('node:assert/strict');
const {generateNhl84Schedule}=require('./hlm-nhl-84-schedule-generator');
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
const {scheduleNhl84Calendar}=require('./hlm-nhl-84-calendar-scheduler');
let n=0;const check=(value,message)=>{assert.ok(value,message);n++;};
const teams=[];
for(let c=0;c<2;c++)for(let d=0;d<2;d++)for(let i=0;i<8;i++)teams.push({id:`${c}-${d}-${i}`,conferenceId:`C${c}`,divisionId:`C${c}D${d}`});
const games=generateNhl84Schedule(teams),before=JSON.stringify({teams,games});
const result=scheduleNhl84Calendar(teams,games,{startDate:'2026-10-01'});
check(result.length===1344,'all games assigned');
check(validateNhl84Schedule(teams,result).valid,'SCH-001 through SCH-006 preserved');
check(result.every(g=>/^2026-|^2027-/.test(g.date)),'date strings assigned');
check(result.every(g=>g.status==='scheduled'),'game status unchanged');
check(result.every((g,i)=>g.id===games[i].id),'game identity preserved');
const daily=new Map();for(const g of result){if(!daily.has(g.date))daily.set(g.date,new Set());const used=daily.get(g.date);check(!used.has(String(g.homeTeamId))&&!used.has(String(g.awayTeamId)),'no team double-booked');used.add(String(g.homeTeamId));used.add(String(g.awayTeamId));}
check(daily.size>=84&&daily.size<=200,'bounded schedule length');
check(JSON.stringify({teams,games})===before,'no input mutation');
check(JSON.stringify(result)===JSON.stringify(scheduleNhl84Calendar(teams,games,{startDate:'2026-10-01'})),'repeatable');
check(JSON.stringify(result)===JSON.stringify(scheduleNhl84Calendar(teams,[...games].reverse(),{startDate:'2026-10-01'})),'input order independent');
check(scheduleNhl84Calendar(teams,games,{startDate:'2028-02-28'})[0].date==='2028-02-28','leap-year date valid');
function reject(name,fn,pattern){assert.throws(fn,pattern,name);n++;}
reject('invalid date',()=>scheduleNhl84Calendar(teams,games,{startDate:'2026-02-30'}),/Invalid calendar date/);
reject('missing date',()=>scheduleNhl84Calendar(teams,games),/startDate/);
reject('invalid horizon',()=>scheduleNhl84Calendar(teams,games,{startDate:'2026-10-01',maxDays:20}),/maxDays/);
reject('invalid matchup count',()=>scheduleNhl84Calendar(teams,games.slice(1),{startDate:'2026-10-01'}),/Invalid NHL84/);
reject('duplicate game',()=>scheduleNhl84Calendar(teams,[games[0],...games.slice(1).map(g=>({...g,id:games[0].id}))],{startDate:'2026-10-01'}),/Invalid NHL84/);
console.log('PASS '+n+' assertions; days='+daily.size+'; games='+result.length);
