'use strict';
const assert=require('node:assert/strict');
const {generateNhl84Schedule}=require('./hlm-nhl-84-schedule-generator');
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
let count=0;
function check(v,msg){assert.ok(v,msg);count++;}
const teams=[];
for(let c=0;c<2;c++)for(let d=0;d<2;d++)for(let i=0;i<8;i++)teams.push({id:`${c}-${d}-${i}`,conferenceId:`C${c}`,divisionId:`C${c}D${d}`});
const snapshot=JSON.stringify(teams);
const games=generateNhl84Schedule(teams);
check(games.length===1344,'1344 games');
check(validateNhl84Schedule(teams,games).valid,'accepted by R2-RULES-01 validator');
check(JSON.stringify(teams)===snapshot,'input unchanged');
check(games.every(g=>g.status==='scheduled'),'scheduled records');
check(new Set(games.map(g=>g.id)).size===1344,'unique game IDs');
check(JSON.stringify(generateNhl84Schedule(teams))===JSON.stringify(games),'repeatable output');
check(JSON.stringify(generateNhl84Schedule([...teams].reverse()))===JSON.stringify(games),'order independent');
const other=teams.map(t=>({...t,id:'X'+t.id}));
check(validateNhl84Schedule(other,generateNhl84Schedule(other)).valid,'renamed league valid');
function reject(name,modify,pattern){const data=structuredClone(teams);modify(data);assert.throws(()=>generateNhl84Schedule(data),pattern,name);count++;}
reject('31 teams',t=>t.pop(),/32 teams/);
reject('duplicate identity',t=>t[1].id=t[0].id,/Duplicate team ID/);
reject('missing ID',t=>delete t[0].id,/Each team needs/);
reject('missing division',t=>delete t[0].divisionId,/Each team needs/);
reject('wrong division size',t=>t[0].divisionId=t[8].divisionId,/two 8-team divisions/);
reject('wrong conference size',t=>t[0].conferenceId=t[16].conferenceId,/Division spans conferences/);
reject('invalid conference',t=>t[0].conferenceId='new',/Division spans conferences/);
assert.throws(()=>generateNhl84Schedule(null),/array/);count++;
console.log('PASS '+count+' assertions');
