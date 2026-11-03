'use strict';
/** R2-RULES-04: isolated deterministic season calendar. No storage or gameplay access. */
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
function dateValue(s){
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new TypeError('Calendar dates must be YYYY-MM-DD');
  const d=new Date(s+'T00:00:00.000Z');
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw new RangeError('Invalid calendar date');
  return d.getTime();
}
function scheduleNhl84RealisticCalendar(teams,games,{startDate,endDate,maxGamesPerDay=12,blockedDates=[]}={}){
  const start=dateValue(startDate),end=dateValue(endDate);
  const days=Math.round((end-start)/86400000)+1;
  if(days<170||days>220||!startDate.endsWith('-10-01')&&startDate.slice(5,7)!=='10'||endDate.slice(5,7)!=='04'||end<=start)
    throw new RangeError('Season must run from October through April (170-220 days)');
  if(!Number.isSafeInteger(maxGamesPerDay)||maxGamesPerDay<8||maxGamesPerDay>16)
    throw new RangeError('maxGamesPerDay must be 8 through 16');
  if(!Array.isArray(blockedDates))throw new TypeError('blockedDates must be an array');
  const blocked=new Set(blockedDates.map(d=>{dateValue(d);return d;}));
  const report=validateNhl84Schedule(teams,games);
  if(!report.valid)throw new Error('Invalid NHL84 matchups: '+report.errors[0].code);
  const ids=[...new Set(teams.map(t=>String(t.id)))].sort();
  const played=new Map(ids.map(id=>[id,0])),last=new Map(ids.map(id=>[id,-100]));
  const remaining=games.map(g=>({...g})).sort((a,b)=>String(a.id).localeCompare(String(b.id),'en'));
  const assigned=[];
  for(let day=0;day<days&&remaining.length;day++){
    const date=new Date(start+day*86400000).toISOString().slice(0,10);
    if(blocked.has(date))continue;
    const occupied=new Set();
    const dailyTarget=Math.min(maxGamesPerDay,Math.ceil(1344/days+(day%3===0?0.3:0)));
    for(let slot=0;slot<dailyTarget;slot++){
      let best=-1,bestScore=-Infinity;
      for(let i=0;i<remaining.length;i++){
        const g=remaining[i],h=String(g.homeTeamId),a=String(g.awayTeamId);
        if(occupied.has(h)||occupied.has(a))continue;
        const hr=day-last.get(h),ar=day-last.get(a);
        if(hr<2||ar<2)continue;
        const urgency=(day+1)*84/days;
        const score=(urgency-played.get(h))+(urgency-played.get(a))+
          Math.min(hr,12)*0.05+Math.min(ar,12)*0.05;
        if(score>bestScore+1e-9){best=i;bestScore=score;}
      }
      if(best<0)break;
      const g=remaining.splice(best,1)[0],h=String(g.homeTeamId),a=String(g.awayTeamId);
      occupied.add(h);occupied.add(a);played.set(h,played.get(h)+1);played.set(a,played.get(a)+1);
      last.set(h,day);last.set(a,day);assigned.push({...g,date});
    }
  }
  if(remaining.length)throw new RangeError('Calendar constraints infeasible: '+remaining.length+' games unassigned');
  return assigned.sort((a,b)=>String(a.id).localeCompare(String(b.id),'en'));
}
module.exports={scheduleNhl84RealisticCalendar};
