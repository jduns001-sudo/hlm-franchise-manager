'use strict';
const assert=require('node:assert/strict');
const {validateNhl84Schedule,REQUIRED}=require('./hlm-nhl-schedule-validator');
let assertions=0;
function check(condition,message){assert.ok(condition,message);assertions++}
function fixture(){
  const teams=[];
  for(let c=0;c<2;c++)for(let d=0;d<2;d++)for(let i=0;i<8;i++)teams.push({id:`${c}-${d}-${i}`,conferenceId:`C${c}`,divisionId:`C${c}D${d}`});
  const games=[];
  function add(a,b,count,homeForA){for(let k=0;k<count;k++){
    const home=k<homeForA?a:b,away=k<homeForA?b:a;
    games.push({id:`G${games.length+1}`,homeTeamId:home.id,awayTeamId:away.id});
  }}
  for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
    const a=teams[i],b=teams[j];
    if(a.divisionId===b.divisionId)add(a,b,4,2);
    else if(a.conferenceId===b.conferenceId){
      const ai=Number(a.id.split('-')[2]),bi=Number(b.id.split('-')[2]);
      add(a,b,3,(ai+bi)%2===0?2:1);
    }else add(a,b,2,1);
  }
  return {teams,games};
}
const original=fixture();
check(original.games.length===REQUIRED.games,'Fixture has 1344 games');
check(validateNhl84Schedule(original.teams,original.games).valid,'Valid schedule accepted');
function reject(label,edit,code){const f=structuredClone(original);edit(f);const v=validateNhl84Schedule(f.teams,f.games);check(!v.valid,label+' rejected');check(v.errors.some(e=>e.code===code),label+' reason '+code);}
reject('missing game',f=>f.games.pop(),'GAME_COUNT');
reject('duplicate game ID',f=>f.games[1].id=f.games[0].id,'DUPLICATE_GAME');
reject('unknown team',f=>f.games[0].homeTeamId='not-a-team','INVALID_MATCHUP');
reject('self-play',f=>f.games[0].homeTeamId=f.games[0].awayTeamId,'INVALID_MATCHUP');
reject('home-away imbalance',f=>{const g=f.games[0];[g.homeTeamId,g.awayTeamId]=[g.awayTeamId,g.homeTeamId]},'TEAM_HOME');
reject('division distribution',f=>{const t=f.teams[0];t.divisionId='C0D1'},'DIVISION_STRUCTURE');
reject('conference structure',f=>f.teams[0].conferenceId='C1','CONFERENCE_STRUCTURE');
reject('missing team',f=>f.teams.pop(),'TEAM_COUNT');
reject('missing ID',f=>delete f.games[0].id,'INVALID_GAME_ID');
reject('duplicate team ID',f=>f.teams[1].id=f.teams[0].id,'DUPLICATE_TEAM');
const before=JSON.stringify(original);validateNhl84Schedule(original.teams,original.games);check(JSON.stringify(original)===before,'No input mutation');
check(!validateNhl84Schedule(null,[]).valid,'Invalid input rejected');
console.log('PASS '+assertions+' assertions');
