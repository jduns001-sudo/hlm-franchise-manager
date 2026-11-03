'use strict';
/** R2-RULES-03: isolated deterministic date assignment for an approved NHL84 matchup set.
 * No arena, travel, blackout, fatigue or actual NHL calendar claims.
 */
const {validateNhl84Schedule}=require('./hlm-nhl-schedule-validator');
function assertDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new TypeError('startDate must be YYYY-MM-DD');
  const d=new Date(value+'T00:00:00.000Z');
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw new RangeError('Invalid calendar date');
  return d;
}
function scheduleNhl84Calendar(teams,games,{startDate,maxDays=200}={}){
  const initial=assertDate(startDate);
  if(!Number.isSafeInteger(maxDays)||maxDays<84||maxDays>366)throw new RangeError('maxDays must be 84 through 366');
  const report=validateNhl84Schedule(teams,games);
  if(!report.valid)throw new Error('Invalid NHL84 matchups: '+report.errors[0].code);
  const ordered=games.slice().sort((a,b)=>String(a.id)<String(b.id)?-1:String(a.id)>String(b.id)?1:0);
  const occupied=Array.from({length:maxDays},()=>new Set());
  const assigned=[];
  for(const game of ordered){
    const home=String(game.homeTeamId),away=String(game.awayTeamId);
    let slot=-1;
    for(let day=0;day<maxDays;day++)if(!occupied[day].has(home)&&!occupied[day].has(away)){slot=day;break;}
    if(slot<0)throw new RangeError('Unable to schedule within maxDays without double-booking');
    occupied[slot].add(home);occupied[slot].add(away);
    const d=new Date(initial.getTime());d.setUTCDate(d.getUTCDate()+slot);
    assigned.push({...game,date:d.toISOString().slice(0,10)});
  }
  return assigned;
}
module.exports={scheduleNhl84Calendar};
