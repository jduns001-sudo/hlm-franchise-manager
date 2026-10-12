'use strict';
const {assertIsoDate,addCalendarDays}=require('./hlm-master-calendar');

/**
 * Deterministic round-robin schedule generator.
 * Every distinct pair plays once per cycle; reverse home/away each second cycle.
 */
function generateRoundRobinSchedule(teams,startDate,cycles=2) {
  assertIsoDate(startDate);
  if (!Array.isArray(teams) || teams.length<2) throw new TypeError('At least two teams required');
  if (!Number.isSafeInteger(cycles) || cycles<1 || cycles>20) throw new RangeError('Cycles must be 1 through 20');
  const ids=teams.map(team=>team && team.id);
  if(ids.some(id=>id==null)||new Set(ids.map(String)).size!==ids.length)throw new Error('Team IDs must be unique and present');
  const entries=ids.slice();
  if(entries.length%2)entries.push(null);
  const rounds=entries.length-1;
  const half=entries.length/2;
  const games=[];
  let day=1;
  for(let cycle=0;cycle<cycles;cycle++){
    const rotation=entries.slice();
    for(let round=0;round<rounds;round++){
      const date=addCalendarDays(startDate,day++);
      for(let i=0;i<half;i++){
        const first=rotation[i],second=rotation[rotation.length-1-i];
        if(first==null||second==null)continue;
        const flip=(round+i+cycle)%2===1;
        const homeTeamId=flip?second:first;
        const awayTeamId=flip?first:second;
        games.push({id:'S'+cycle+'-R'+round+'-G'+i,date,status:'scheduled',homeTeamId,awayTeamId});
      }
      rotation.splice(1,0,rotation.pop());
    }
  }
  return games;
}
module.exports={generateRoundRobinSchedule};
