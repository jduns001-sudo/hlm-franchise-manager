'use strict';
/** R2-RULES-02: deterministic, mathematical 84-game schedule, not a calendar.
 * Each 8-team division plays its peers four times (28), each other division
 * in the same conference three times (24), and opposite conference twice (32).
 * No writes, dates, gameplay, or production integration.
 */
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
function generateNhl84Schedule(teams){
  if(!Array.isArray(teams))throw new TypeError('Teams must be an array');
  if(teams.length!==32)throw new RangeError('Exactly 32 teams required');
  const groups=new Map(), ids=new Set(), conferences=new Map();
  for(const team of teams){
    if(!team||!['string','number'].includes(typeof team.id)||!String(team.id).trim()||
       !['string','number'].includes(typeof team.conferenceId)||!String(team.conferenceId).trim()||
       !['string','number'].includes(typeof team.divisionId)||!String(team.divisionId).trim())
      throw new TypeError('Each team needs id, conferenceId and divisionId');
    const id=String(team.id),conf=String(team.conferenceId),div=String(team.divisionId);
    if(ids.has(id))throw new Error('Duplicate team ID: '+id);
    ids.add(id);
    if(!groups.has(div))groups.set(div,{conf,teams:[]});
    if(groups.get(div).conf!==conf)throw new Error('Division spans conferences: '+div);
    groups.get(div).teams.push({id,conf,div});
    conferences.set(conf,(conferences.get(conf)||0)+1);
  }
  if(conferences.size!==2||[...conferences.values()].some(n=>n!==16)||groups.size!==4||
     [...groups.values()].some(g=>g.teams.length!==8))throw new Error('Expected two 16-team conferences, each with two 8-team divisions');
  const ordered=[...groups.values()].flatMap(g=>g.teams).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const games=[];
  function record(home,away){games.push({id:'NHL84-'+String(games.length+1).padStart(4,'0'),homeTeamId:home.id,awayTeamId:away.id,status:'scheduled'});}
  for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
    const a=ordered[i],b=ordered[j];
    if(a.div===b.div){record(a,b);record(b,a);record(a,b);record(b,a);}
    else if(a.conf!==b.conf){record(a,b);record(b,a);}
    else {
      const aIndex=groups.get(a.div).teams.map(t=>t.id).sort().indexOf(a.id);
      const bIndex=groups.get(b.div).teams.map(t=>t.id).sort().indexOf(b.id);
      if((aIndex+bIndex)%2===0){record(a,b);record(b,a);record(a,b);}
      else {record(b,a);record(a,b);record(b,a);}
    }
  }
  const report=validateNhl84Schedule(teams,games);
  if(!report.valid)throw new Error('Generated schedule violates NHL84 validator: '+report.errors.slice(0,3).map(e=>e.code).join(','));
  return games;
}
module.exports={generateNhl84Schedule};
