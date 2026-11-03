'use strict';
/** R2-RULES-01: read-only validator for HLM27's approved 32-team, 84-game ruleset.
 * Does not generate schedules, mutate inputs, read storage, or select an NHL season.
 */
const REQUIRED = Object.freeze({teams:32,games:1344,perTeam:84,home:42,away:42,division:28,conference:24,interconference:32});
function validateNhl84Schedule(teams,games){
  const errors=[];
  const fail=(code,detail)=>errors.push({code,detail:String(detail)});
  if(!Array.isArray(teams)||!Array.isArray(games))return {valid:false,errors:[{code:'INVALID_INPUT',detail:'Teams and games must be arrays'}]};
  if(teams.length!==REQUIRED.teams)fail('TEAM_COUNT',teams.length);
  const byId=new Map(),divisions=new Map(),conferences=new Map();
  for(const t of teams){
    if(!t||!['string','number'].includes(typeof t.id)||String(t.id).trim()===''||!['string','number'].includes(typeof t.conferenceId)||String(t.conferenceId).trim()===''||!['string','number'].includes(typeof t.divisionId)||String(t.divisionId).trim()===''){
      fail('INVALID_TEAM','Missing team ID, conferenceId, or divisionId');continue;
    }
    const id=String(t.id),conf=String(t.conferenceId),div=String(t.divisionId);
    if(byId.has(id)){fail('DUPLICATE_TEAM',id);continue;}
    byId.set(id,{conf,div,home:0,away:0,division:0,conference:0,interconference:0});
    if(!divisions.has(div))divisions.set(div,{conf,count:0});
    if(divisions.get(div).conf!==conf)fail('DIVISION_CONFERENCE_CONFLICT',div);
    divisions.get(div).count++;
    conferences.set(conf,(conferences.get(conf)||0)+1);
  }
  if(conferences.size!==2||[...conferences.values()].some(n=>n!==16))fail('CONFERENCE_STRUCTURE','Expected two conferences of 16 teams');
  if(divisions.size!==4||[...divisions.values()].some(d=>d.count!==8))fail('DIVISION_STRUCTURE','Expected four divisions of 8 teams');
  if(games.length!==REQUIRED.games)fail('GAME_COUNT',games.length);
  const ids=new Set();
  for(let i=0;i<games.length;i++){
    const g=games[i];
    if(!g||!['string','number'].includes(typeof g.id)||String(g.id).trim()===''){fail('INVALID_GAME_ID',i);continue;}
    const id=String(g.id);
    if(ids.has(id))fail('DUPLICATE_GAME',id);else ids.add(id);
    if(!['string','number'].includes(typeof g.homeTeamId)||!['string','number'].includes(typeof g.awayTeamId)){fail('INVALID_MATCHUP',id);continue;}
    const home=byId.get(String(g.homeTeamId)),away=byId.get(String(g.awayTeamId));
    if(!home||!away||String(g.homeTeamId)===String(g.awayTeamId)){fail('INVALID_MATCHUP',id);continue;}
    home.home++;away.away++;
    const category=home.conf!==away.conf?'interconference':home.div!==away.div?'conference':'division';
    home[category]++;away[category]++;
  }
  for(const [id,t] of byId){
    const total=t.home+t.away;
    for(const [field,expected] of [['total',84],['home',42],['away',42],['division',28],['conference',24],['interconference',32]]){
      const actual=field==='total'?total:t[field];
      if(actual!==expected)fail('TEAM_'+field.toUpperCase(),id+': '+actual+' expected '+expected);
    }
  }
  return {valid:errors.length===0,errors};
}
module.exports={REQUIRED,validateNhl84Schedule};
