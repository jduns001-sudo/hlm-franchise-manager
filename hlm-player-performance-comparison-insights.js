'use strict';
// Experimental, read-only and opt-in by explicit caller invocation.
const assertFinite = (v) => typeof v === 'number' && Number.isFinite(v);
function summarize(games, windowSize = 5) {
  if (!Array.isArray(games)) throw new TypeError('games must be an array');
  if (!Number.isInteger(windowSize) || windowSize < 1) throw new RangeError('windowSize');
  const ordered = games.map((g,i) => {
    if (!g || !['shots','goals','assists'].every(k => Number.isInteger(g[k]) && g[k] >= 0)) throw new TypeError('invalid box score');
    if (g.goals > g.shots) throw new RangeError('goals exceed shots');
    return {shots:g.shots, goals:g.goals, assists:g.assists, index:i};
  });
  const n=ordered.length, totals=ordered.reduce((a,g)=>({shots:a.shots+g.shots,goals:a.goals+g.goals,assists:a.assists+g.assists}),{shots:0,goals:0,assists:0});
  const points=ordered.map(g=>g.goals+g.assists);
  const avg=n?points.reduce((a,b)=>a+b,0)/n:null;
  const variance=n?points.reduce((a,b)=>a+(b-avg)**2,0)/n:null;
  const recent=points.slice(-windowSize), prior=points.slice(-2*windowSize,-windowSize);
  const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const recentMean=mean(recent), priorMean=mean(prior);
  const trend=prior.length===windowSize && recent.length===windowSize ? recentMean-priorMean : null;
  const confidence=totals.shots>=30?'higher':totals.shots>=10?'moderate':'limited';
  return Object.freeze({games:n,totals:Object.freeze(totals),pointsPerGame:avg,volatility:variance===null?null:Math.sqrt(variance),consistency:variance===null?null:1/(1+Math.sqrt(variance)),finishingRate:totals.shots?totals.goals/totals.shots:null,finishingConfidence:confidence,rollingPointsPerGame:recentMean,priorRollingPointsPerGame:priorMean,trendDelta:trend,trendDirection:trend===null?'insufficient-sample':trend>0?'improving':trend<0?'declining':'stable',reliability:n>=20?'established':n>=5?'developing':'limited'});
}
function compare(a,b,windowSize=5) {
  const left=summarize(a,windowSize),right=summarize(b,windowSize);
  const diff=(x,y)=>x===null||y===null?null:x-y;
  return Object.freeze({left,right,pointsPerGameDelta:diff(left.pointsPerGame,right.pointsPerGame),finishingDelta:diff(left.finishingRate,right.finishingRate),interpretation:Math.min(left.games,right.games)<5?'small-sample':left.pointsPerGame===right.pointsPerGame?'even':'directional-only'});
}
function rank(entries) {
  return entries.map((e,i)=>({id:String(e.id),summary:summarize(e.games),index:i})).sort((a,b)=>(b.summary.consistency??-1)-(a.summary.consistency??-1)||a.id.localeCompare(b.id)||a.index-b.index);
}
module.exports={summarize,compare,rank};
