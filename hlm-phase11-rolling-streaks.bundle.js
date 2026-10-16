/* Experimental rolling streaks browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-multigame-consistency')return global.HLMPhase11MultiGameConsistency;throw Error('Unsupported module')};
'use strict';
/* Experimental, read-only rolling player and team finishing streaks. */
const {summarizeMultiGameConsistency}=require('./hlm-phase11-multigame-consistency');
const round=n=>Number(n.toFixed(6));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
const pct=(g,s)=>s?round(g/s):null;
const windows=[3,5];
function rolling(trends,size){
 return trends.map((_,i)=>{
  if(i+1<size)return null;
  const items=trends.slice(i+1-size,i+1),shots=sum(items,'shots'),goals=sum(items,'goals'),xg=round(sum(items,'expectedGoals'));
  return {endingGame:i+1,games:size,shots,goals,expectedGoals:xg,shootingPercentage:pct(goals,shots),goalsAboveExpected:round(goals-xg)};
 }).filter(Boolean);
}
function streak(trends){
 let hot=0,cold=0;
 for(let i=trends.length-1;i>=0;i--){
  const delta=trends[i].goals-trends[i].expectedGoals;
  if(delta>0){if(cold)break;hot++}
  else if(delta<0){if(hot)break;cold++}
  else break;
 }
 return {status:hot>=2?'hot':cold>=2?'cold':'neutral',hotGames:hot,coldGames:cold};
}
function summarizeRollingStreaks(homeLineup,awayLineup,options={}){
 const base=summarizeMultiGameConsistency(homeLineup,awayLineup,options);
 const decorate=x=>({...x,rolling3:rolling(x.gameTrends,3),rolling5:rolling(x.gameTrends,5),streak:streak(x.gameTrends)});
 const players=base.players.map(decorate);
 const teams={home:decorate(base.teams.home),away:decorate(base.teams.away)};
 for(const team of ['home','away']){
  const members=players.filter(p=>p.team===team);
  for(const size of windows){
   const key='rolling'+size;
   for(let i=0;i<teams[team][key].length;i++){
    const ending=teams[team][key][i].endingGame;
    const ps=members.map(p=>p[key].find(w=>w.endingGame===ending)).filter(Boolean);
    const t=teams[team][key][i];
    if(sum(ps,'shots')!==t.shots||sum(ps,'goals')!==t.goals||
       Math.abs(sum(ps,'expectedGoals')-t.expectedGoals)>members.length*0.000001+0.000001)throw Error('Rolling team conservation mismatch');
   }
  }
  for(const p of members){
   for(const size of windows){
    const key='rolling'+size;
    for(const w of p[key]){
     const subset=p.gameTrends.slice(w.endingGame-size,w.endingGame);
     if(sum(subset,'shots')!==w.shots||sum(subset,'goals')!==w.goals||
        Math.abs(sum(subset,'expectedGoals')-w.expectedGoals)>size*0.000001+0.000001)throw Error('Rolling player conservation mismatch');
    }
   }
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
 seed:base.seed,games:base.games,windows,teams,players,summaryModel:'experimental-rolling-streaks-v1'};
}
module.exports={summarizeRollingStreaks,rolling,streak};

global.HLMPhase11RollingStreaks=module.exports;
})(typeof window!=='undefined'?window:globalThis);
