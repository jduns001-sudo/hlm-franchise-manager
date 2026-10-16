/* Experimental multi-game consistency browser bundle. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-finishing-trends')return global.HLMPhase11FinishingTrends;throw Error('Unsupported module')};
'use strict';
/* Isolated experimental multi-game player finishing and consistency analytics. */
const {summarizeFinishingTrends}=require('./hlm-phase11-finishing-trends');
const round=n=>Number(n.toFixed(6));
const sum=(a,k)=>a.reduce((v,x)=>v+x[k],0);
const average=a=>a.length?a.reduce((v,x)=>v+x,0)/a.length:0;
const variance=a=>{const m=average(a);return average(a.map(x=>(x-m)**2))};
const tiers=['low','medium','high'];
const emptyTier=()=>({shots:0,goals:0,expectedGoals:0});
const pct=(g,s)=>s?round(g/s):null;
function summarizeMultiGameConsistency(homeLineup,awayLineup,options={}){
 const {games=5,seed=11,...gameOptions}=options;
 if(!Number.isInteger(games)||games<1||games>30)throw new RangeError('games must be between 1 and 30');
 if(!Number.isSafeInteger(seed))throw new RangeError('seed must be a safe integer');
 const reports=Array.from({length:games},(_,i)=>summarizeFinishingTrends(homeLineup,awayLineup,{...gameOptions,seed:seed+i*7919}));
 const identities=new Map();
 for(const game of reports)for(const p of game.players){
  const key=p.team+':'+p.playerId;
  if(!identities.has(key))identities.set(key,{team:p.team,playerId:p.playerId});
 }
 const summarize=(rows)=>{const shots=sum(rows,'shots'),goals=sum(rows,'goals'),expectedGoals=round(sum(rows,'expectedGoals'));
  const shotSeries=rows.map(x=>x.shots),goalSeries=rows.map(x=>x.goals),xgSeries=rows.map(x=>x.expectedGoals);
  return {games:rows.length,shots,goals,expectedGoals,shootingPercentage:pct(goals,shots),goalsAboveExpected:round(goals-expectedGoals),
   meanShotsPerGame:round(average(shotSeries)),shotVolumeVariance:round(variance(shotSeries)),
   meanXGPerGame:round(average(xgSeries)),xGVariance:round(variance(xgSeries)),
   finishingVariance:round(variance(rows.map(x=>x.goals-x.expectedGoals))),
   shotVolumeConsistency:round(1/(1+variance(shotSeries))),
   gameTrends:rows.map((x,i)=>({game:i+1,seed:seed+i*7919,shots:x.shots,goals:x.goals,expectedGoals:x.expectedGoals,
    shootingPercentage:pct(x.goals,x.shots),goalsAboveExpected:round(x.goals-x.expectedGoals)}))};
 };
 const players=[...identities.values()].sort((a,b)=>a.team.localeCompare(b.team)||a.playerId.localeCompare(b.playerId)).map(id=>{
  const rows=reports.map(r=>r.players.find(p=>p.team===id.team&&p.playerId===id.playerId)||
   {shots:0,goals:0,expectedGoals:0,dangerEfficiency:Object.fromEntries(tiers.map(t=>[t,emptyTier()]))});
  const dangerEfficiency=Object.fromEntries(tiers.map(t=>{const tierRows=rows.map(p=>p.dangerEfficiency[t]);return [t,{shots:sum(tierRows,'shots'),goals:sum(tierRows,'goals'),expectedGoals:round(sum(tierRows,'expectedGoals')),
    shootingPercentage:pct(sum(tierRows,'goals'),sum(tierRows,'shots'))}]}));
  return {...id,...summarize(rows),dangerEfficiency};
 });
 const teams={};
 for(const team of ['home','away']){
  const rows=reports.map(r=>r.teams[team]);
  const dangerEfficiency=Object.fromEntries(tiers.map(t=>{const tierRows=rows.map(p=>p.dangerEfficiency[t]);return [t,{shots:sum(tierRows,'shots'),goals:sum(tierRows,'goals'),expectedGoals:round(sum(tierRows,'expectedGoals')),
    shootingPercentage:pct(sum(tierRows,'goals'),sum(tierRows,'shots'))}]}));
  teams[team]={...summarize(rows),dangerEfficiency};
  const members=players.filter(p=>p.team===team);
  if(sum(members,'shots')!==teams[team].shots||sum(members,'goals')!==teams[team].goals||
    Math.abs(sum(members,'expectedGoals')-teams[team].expectedGoals)>members.length*0.000001+0.000001)throw Error('Multi-game team conservation mismatch');
  for(const tier of tiers){
   const items=members.map(p=>p.dangerEfficiency[tier]),t=teams[team].dangerEfficiency[tier];
   if(sum(items,'shots')!==t.shots||sum(items,'goals')!==t.goals||
    Math.abs(sum(items,'expectedGoals')-t.expectedGoals)>members.length*0.000001+0.000001)throw Error('Multi-game tier conservation mismatch');
  }
  for(let i=0;i<games;i++){
   const items=members.map(p=>p.gameTrends[i]),t=teams[team].gameTrends[i];
   if(sum(items,'shots')!==t.shots||sum(items,'goals')!==t.goals||
    Math.abs(sum(items,'expectedGoals')-t.expectedGoals)>members.length*0.000001+0.000001)throw Error('Multi-game daily conservation mismatch');
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
 seed,games,teams,players,summaryModel:'experimental-multigame-consistency-v1'};
}
module.exports={summarizeMultiGameConsistency};

global.HLMPhase11MultiGameConsistency=module.exports;
})(typeof window!=='undefined'?window:globalThis);
