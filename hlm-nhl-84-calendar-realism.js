'use strict';
/** R2-RULES-05R: isolated deterministic calendar realism layer for an approved NHL84 matchup set.
 * Adds controlled back-to-backs, varied rest and inactivity safeguards. Fails closed; never mutates input.
 * No storage, UI, gameplay or save access.
 */
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
const DAY=86400000;
function dateValue(s){
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new TypeError('Calendar dates must be YYYY-MM-DD');
  const d=new Date(s+'T00:00:00.000Z');
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw new RangeError('Invalid calendar date');
  return d.getTime();
}
function intOption(value,name,min,max){
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(name+' must be '+min+' through '+max);
}
function auditNhl84CalendarRealism(games){
  const byTeam=new Map(),months=new Map(),perDay=new Map();
  for(const g of games){
    months.set(g.date.slice(0,7),(months.get(g.date.slice(0,7))||0)+1);
    perDay.set(g.date,(perDay.get(g.date)||0)+1);
    for(const id of [String(g.homeTeamId),String(g.awayTeamId)]){
      if(!byTeam.has(id))byTeam.set(id,[]);
      byTeam.get(id).push(Date.parse(g.date));
    }
  }
  let maxBackToBacks=0,maxInactiveGap=0,tripleRuns=0;const gaps=new Set();
  for(const times of byTeam.values()){
    times.sort((a,b)=>a-b);
    let b2b=0;
    for(let i=1;i<times.length;i++){
      const gap=(times[i]-times[i-1])/DAY;
      gaps.add(gap);if(gap>maxInactiveGap)maxInactiveGap=gap;
      if(gap===1){b2b++;if(i>1&&(times[i-1]-times[i-2])/DAY===1)tripleRuns++;}
    }
    if(b2b>maxBackToBacks)maxBackToBacks=b2b;
  }
  return {months:Object.fromEntries([...months].sort()),maxBackToBacks,maxInactiveGap,tripleRuns,
    distinctRestGaps:[...gaps].sort((a,b)=>a-b),maxGamesInDay:Math.max(0,...perDay.values()),activeDays:perDay.size};
}
function scheduleNhl84CalendarRealism(teams,games,options={}){
  const {startDate,endDate,maxGamesPerDay=12,maxBackToBacksPerTeam=10,maxInactiveDays=7,blockedDates=[]}=options;
  const start=dateValue(startDate),end=dateValue(endDate);
  const days=Math.round((end-start)/DAY)+1;
  if(startDate.slice(5,7)!=='10'||endDate.slice(5,7)!=='04'||days<170||days>220)
    throw new RangeError('Season must run from October through April (170-220 days)');
  intOption(maxGamesPerDay,'maxGamesPerDay',8,16);
  intOption(maxBackToBacksPerTeam,'maxBackToBacksPerTeam',0,20);
  intOption(maxInactiveDays,'maxInactiveDays',4,14);
  if(!Array.isArray(blockedDates))throw new TypeError('blockedDates must be an array');
  const blocked=new Set(blockedDates.map(d=>{dateValue(d);return d;}));
  const report=validateNhl84Schedule(teams,games);
  if(!report.valid)throw new Error('Invalid NHL84 matchups: '+report.errors[0].code);
  const ids=[...new Set(teams.map(t=>String(t.id)))].sort();
  const idx=new Map(ids.map((id,i)=>[id,i]));
  const played=new Map(ids.map(id=>[id,0])),last=new Map(ids.map(id=>[id,null])),
    b2b=new Map(ids.map(id=>[id,0])),prevGap=new Map(ids.map(id=>[id,99]));
  const remaining=games.map(g=>({...g})).sort((a,b)=>String(a.id).localeCompare(String(b.id),'en'));
  const assigned=[];
  for(let day=0;day<days&&remaining.length;day++){
    const date=new Date(start+day*DAY).toISOString().slice(0,10);
    if(blocked.has(date))continue;
    const occupied=new Set();
    const pace=Math.round(games.length*(day+1)/days)-assigned.length;
    const target=Math.max(0,Math.min(maxGamesPerDay,pace+(day%7===5?1:0)-(day%7===2&&pace>1?1:0)));
    for(let slot=0;slot<target;slot++){
      let best=-1,bestScore=-Infinity;
      const urgency=(day+1)*84/days;
      for(let i=0;i<remaining.length;i++){
        const g=remaining[i],h=String(g.homeTeamId),a=String(g.awayTeamId);
        if(occupied.has(h)||occupied.has(a))continue;
        let score=0,ok=true;
        for(const t of [h,a]){
          const gap=last.get(t)===null?day+1:day-last.get(t);
          if(gap<1){ok=false;break;}
          if(gap===1&&(b2b.get(t)>=maxBackToBacksPerTeam||prevGap.get(t)===1)){ok=false;break;}
          score+=(urgency-played.get(t))+Math.min(gap,maxInactiveDays)*0.1-(gap===1?0.9:0)
            +((day*5+idx.get(t)*3)%4)*0.05;
          if(gap>=maxInactiveDays-1)score+=5;
        }
        if(!ok)continue;
        if(score>bestScore+1e-9){best=i;bestScore=score;}
      }
      if(best<0)break;
      const g=remaining.splice(best,1)[0];
      for(const t of [String(g.homeTeamId),String(g.awayTeamId)]){
        const gap=last.get(t)===null?null:day-last.get(t);
        if(gap===1)b2b.set(t,b2b.get(t)+1);
        prevGap.set(t,gap===null?99:gap);
        occupied.add(t);played.set(t,played.get(t)+1);last.set(t,day);
      }
      assigned.push({...g,date});
    }
  }
  if(remaining.length)throw new RangeError('Calendar constraints infeasible: '+remaining.length+' games unassigned');
  const result=assigned.sort((a,b)=>String(a.id).localeCompare(String(b.id),'en'));
  const audit=auditNhl84CalendarRealism(result);
  if(audit.maxInactiveGap>maxInactiveDays)throw new RangeError('Calendar constraints infeasible: inactivity limit exceeded');
  if(audit.maxBackToBacks>maxBackToBacksPerTeam||audit.tripleRuns>0)throw new RangeError('Calendar constraints infeasible: back-to-back limit exceeded');
  if(Object.keys(audit.months).length<7||!audit.months[endDate.slice(0,7)])throw new RangeError('Calendar constraints infeasible: October-April coverage');
  return result;
}
module.exports={scheduleNhl84CalendarRealism,auditNhl84CalendarRealism};
