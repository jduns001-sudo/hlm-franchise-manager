'use strict';
// Experimental, read-only analytics. No persistence, runtime registration, or GM actions.
const valid = g => g && ['shots','goals','assists'].every(k=>Number.isSafeInteger(g[k])&&g[k]>=0)&&g.goals<=g.shots;
function summarize(games,windowSize=5){
 if(!Array.isArray(games))throw new TypeError('games must be an array');
 if(!Number.isSafeInteger(windowSize)||windowSize<1)throw new RangeError('windowSize');
 if(!games.every(valid))throw new RangeError('invalid box score or goals exceed shots');
 const n=games.length,totals=games.reduce((a,g)=>({shots:a.shots+g.shots,goals:a.goals+g.goals,assists:a.assists+g.assists}),{shots:0,goals:0,assists:0});
 if(!Object.values(totals).every(Number.isSafeInteger))throw new RangeError('totals overflow');
 const points=games.map(g=>g.goals+g.assists),mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
 const avg=mean(points),variance=n?mean(points.map(p=>(p-avg)**2)):null;
 const recent=points.slice(-windowSize),prior=points.slice(-2*windowSize,-windowSize);
 const delta=recent.length===windowSize&&prior.length===windowSize?mean(recent)-mean(prior):null;
 return Object.freeze({games:n,totals:Object.freeze(totals),pointsPerGame:avg,volatility:variance===null?null:Math.sqrt(variance),consistency:variance===null?null:1/(1+Math.sqrt(variance)),finishingRate:totals.shots?totals.goals/totals.shots:null,finishingConfidence:totals.shots>=30?'higher':totals.shots>=10?'moderate':'limited',rollingPointsPerGame:mean(recent),priorRollingPointsPerGame:mean(prior),trendDelta:delta,trendDirection:delta===null?'insufficient-sample':delta>0?'improving':delta<0?'declining':'stable',reliability:n>=20?'established':n>=5?'developing':'limited'});
}
function compare(a,b,windowSize=5){
 const left=summarize(a,windowSize),right=summarize(b,windowSize),diff=(x,y)=>x===null||y===null?null:x-y;
 return Object.freeze({left,right,pointsPerGameDelta:diff(left.pointsPerGame,right.pointsPerGame),finishingDelta:diff(left.finishingRate,right.finishingRate),interpretation:Math.min(left.games,right.games)<5?'small-sample':left.pointsPerGame===right.pointsPerGame?'even':'directional-only'});
}
function rank(entries){if(!Array.isArray(entries))throw new TypeError('entries');return entries.map((e,i)=>({id:String(e.id),summary:summarize(e.games),index:i})).sort((a,b)=>(b.summary.consistency??-1)-(a.summary.consistency??-1)||a.id.localeCompare(b.id)||a.index-b.index);}
function aggregateTeam(players){
 if(!Array.isArray(players))throw new TypeError('players');
 const ids=new Set(),games=new Map();
 for(const p of players){
  if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id)||!Array.isArray(p.games))throw new TypeError('invalid or duplicate player');
  ids.add(p.id);
  for(const g of p.games){
   if(!g||typeof g.gameId!=='string'||!g.gameId||!valid(g))throw new TypeError('invalid team game');
   const prev=games.get(g.gameId)||{shots:0,goals:0,assists:0};
   const next={shots:prev.shots+g.shots,goals:prev.goals+g.goals,assists:prev.assists+g.assists};
   if(!Object.values(next).every(Number.isSafeInteger))throw new RangeError('team overflow');
   games.set(g.gameId,next);
  }
 }
 return Object.freeze({gameIds:Object.freeze([...games.keys()].sort()),summary:summarize([...games.keys()].sort().map(id=>games.get(id))),players:players.length});
}
// Deterministic seed only selects a stable presentation ordering; never changes observed statistics.
function seededRank(entries,seed=0){
 if(!Number.isSafeInteger(seed)||seed<0)throw new RangeError('seed');
 const hash=s=>{let h=(2166136261^seed)>>>0;for(const c of s){h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;}return h;};
 return rank(entries).sort((a,b)=>(b.summary.consistency??-1)-(a.summary.consistency??-1)||hash(a.id)-hash(b.id)||a.id.localeCompare(b.id));
}
function interpret(a,b,windowSize=5){
 const c=compare(a,b,windowSize),d=c.pointsPerGameDelta;
 return Object.freeze({sample:c.interpretation==='small-sample'?'limited':'comparative',direction:d===null?'unavailable':d>0?'left-higher':d<0?'right-higher':'even',trendLeft:c.left.trendDirection,trendRight:c.right.trendDirection,statement:c.interpretation==='small-sample'?'Insufficient history for a confident comparison.':'Historical differences are descriptive, not predictive.'});
}
module.exports={summarize,compare,rank,aggregateTeam,seededRank,interpret};
