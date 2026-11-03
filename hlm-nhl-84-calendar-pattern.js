'use strict';
/** R2-RULES-06R: isolated deterministic NHL84 calendar pattern realism.
 * Adds weekday-shaped daily game-volume variation and a configurable per-team back-to-back target
 * (soft goal) under hard back-to-back, rest and inactivity caps. Fails closed; never mutates input.
 * No storage, UI, gameplay or save access.
 */
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
const {auditNhl84CalendarRealism}=require('./hlm-nhl-84-calendar-realism');
const DAY=86400000;
// Sunday..Saturday relative volume weights
const WEEKDAY_SHAPE=[0.15,0.2,-0.45,0.25,0.1,-0.3,0.3];
function dateValue(s){
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new TypeError('Calendar dates must be YYYY-MM-DD');
  const d=new Date(s+'T00:00:00.000Z');
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw new RangeError('Invalid calendar date');
  return d.getTime();
}
function intOption(value,name,min,max){
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(name+' must be '+min+' through '+max);
}
function scheduleNhl84CalendarPattern(teams,games,options={}){
  const {startDate,endDate,maxGamesPerDay=14,minGamesPerDay=2,volumeVariation=0.6,
    backToBackTarget=3,maxBackToBacks=6,maxInactiveDays=7,blockedDates=[]}=options;
  const start=dateValue(startDate),end=dateValue(endDate);
  const days=Math.round((end-start)/DAY)+1;
  if(startDate.slice(5,7)!=='10'||endDate.slice(5,7)!=='04'||days<170||days>220)
    throw new RangeError('Season must run from October through April (170-220 days)');
  intOption(maxGamesPerDay,'maxGamesPerDay',8,16);
  intOption(minGamesPerDay,'minGamesPerDay',0,maxGamesPerDay);
  intOption(maxBackToBacks,'maxBackToBacks',0,20);
  intOption(backToBackTarget,'backToBackTarget',0,maxBackToBacks);
  intOption(maxInactiveDays,'maxInactiveDays',4,14);
  if(typeof volumeVariation!=='number'||!(volumeVariation>=0&&volumeVariation<=1))
    throw new RangeError('volumeVariation must be 0 through 1');
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
  let playable=0;
  for(let day=0;day<days;day++)if(!blocked.has(new Date(start+day*DAY).toISOString().slice(0,10)))playable++;
  let left=playable;
  for(let day=0;day<days&&remaining.length;day++){
    const dt=new Date(start+day*DAY),date=dt.toISOString().slice(0,10);
    if(blocked.has(date))continue;
    const base=remaining.length/left;
    const jitter=(((day*7+3)%5)-2)/10;
    const shape=WEEKDAY_SHAPE[dt.getUTCDay()]+jitter;
    // Final stretch drops the weekday shape and catches up so tight caps cannot strand games
    const target=left<=10
      ?Math.min(maxGamesPerDay,Math.ceil(base))
      :Math.max(Math.min(minGamesPerDay,remaining.length),
        Math.min(maxGamesPerDay,Math.round(base*(1+volumeVariation*shape))));
    left--;
    const occupied=new Set();
    const urgency=(day+1)*84/days;
    const b2bGoal=backToBackTarget*(day+1)/days;
    for(let slot=0;slot<target;slot++){
      let best=-1,bestScore=-Infinity;
      for(let i=0;i<remaining.length;i++){
        const g=remaining[i],h=String(g.homeTeamId),a=String(g.awayTeamId);
        if(occupied.has(h)||occupied.has(a))continue;
        let score=0,ok=true;
        for(const t of [h,a]){
          const gap=last.get(t)===null?day+1:day-last.get(t);
          if(gap<1){ok=false;break;}
          if(gap===1&&(b2b.get(t)>=maxBackToBacks||prevGap.get(t)===1)){ok=false;break;}
          score+=(urgency-played.get(t))+Math.min(gap,maxInactiveDays)*0.1
            +((day*5+idx.get(t)*3)%4)*0.05;
          if(gap===1)score+=b2b.get(t)<b2bGoal?0.6:-1.2;
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
  if(audit.maxBackToBacks>maxBackToBacks||audit.tripleRuns>0)throw new RangeError('Calendar constraints infeasible: back-to-back limit exceeded');
  if(audit.maxGamesInDay>maxGamesPerDay)throw new RangeError('Calendar constraints infeasible: daily cap exceeded');
  if(Object.keys(audit.months).length<7||!audit.months[endDate.slice(0,7)])throw new RangeError('Calendar constraints infeasible: October-April coverage');
  return result;
}
module.exports={scheduleNhl84CalendarPattern};
