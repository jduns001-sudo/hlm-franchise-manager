'use strict';
// Experimental read-only multi-season historical analytics. Caller owns all inputs.
const {summarize,aggregateTeam}=require('./hlm-player-performance-comparison-insights');
const key=s=>String(s);
function history(seasons,{window=3}={}){
 if(!Array.isArray(seasons)||!Number.isSafeInteger(window)||window<1)throw new TypeError('invalid history');
 const seen=new Set();
 const rows=seasons.map(s=>{
  if(!s||!Number.isSafeInteger(s.season)||seen.has(s.season)||!Array.isArray(s.games))throw new TypeError('invalid or duplicate season');
  seen.add(s.season);return Object.freeze({season:s.season,summary:summarize(s.games)});
 }).sort((a,b)=>a.season-b.season);
 const rolling=rows.map((r,i)=>{
  const subset=rows.slice(Math.max(0,i-window+1),i+1);
  const games=subset.reduce((n,x)=>n+x.summary.games,0);
  const totals=subset.reduce((a,x)=>({goals:a.goals+x.summary.totals.goals,assists:a.assists+x.summary.totals.assists,shots:a.shots+x.summary.totals.shots}),{goals:0,assists:0,shots:0});
  return Object.freeze({season:r.season,seasons:subset.length,games,pointsPerGame:games?(totals.goals+totals.assists)/games:null,finishingRate:totals.shots?totals.goals/totals.shots:null,sample:games>=20?'established':games>=5?'developing':'limited'});
 });
 const latest=rolling.at(-1),previous=rolling.at(-2);
 return Object.freeze({seasons:Object.freeze(rows),rolling:Object.freeze(rolling),trend:!latest||!previous||latest.pointsPerGame===null||previous.pointsPerGame===null?'insufficient-sample':latest.pointsPerGame>previous.pointsPerGame?'improving':latest.pointsPerGame<previous.pointsPerGame?'declining':'stable'});
}
function teamHistory(seasons,opts){
 return history(seasons.map(s=>({season:s.season,games:aggregateTeam(s.players).gameIds.map(id=>{
  const record=s.players.reduce((a,p)=>{const g=p.games.find(x=>x.gameId===id);return g?{shots:a.shots+g.shots,goals:a.goals+g.goals,assists:a.assists+g.assists}:a;},{shots:0,goals:0,assists:0});return record;
 })})),opts);
}
function dashboard(left,right,opts){
 const a=history(left,opts),b=history(right,opts);
 const x=a.rolling.at(-1),y=b.rolling.at(-1);
 const comparable=!!x&&!!y&&x.games>=5&&y.games>=5;
 return Object.freeze({left:a,right:b,comparison:comparable?'directional-only':'insufficient-sample',pointsPerGameDelta:comparable?x.pointsPerGame-y.pointsPerGame:null,disclaimer:'Historical descriptive insights only; human GM retains all decisions.'});
}
module.exports={history,teamHistory,dashboard};
