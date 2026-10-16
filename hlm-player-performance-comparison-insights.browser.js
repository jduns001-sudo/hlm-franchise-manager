// Browser-only standalone experimental adapter. No production save access.
(function(root){
 'use strict';
 function summarize(games){
  if(!Array.isArray(games)||!games.every(g=>g&&['shots','goals','assists'].every(k=>Number.isSafeInteger(g[k])&&g[k]>=0)&&g.goals<=g.shots))throw Error('invalid games');
  const n=games.length,totals=games.reduce((a,g)=>({shots:a.shots+g.shots,goals:a.goals+g.goals,assists:a.assists+g.assists}),{shots:0,goals:0,assists:0});
  const mean=x=>x.length?x.reduce((a,b)=>a+b,0)/x.length:null,points=games.map(g=>g.goals+g.assists);
  const a=points.slice(-5),b=points.slice(-10,-5),delta=a.length===5&&b.length===5?mean(a)-mean(b):null;
  return {games:n,totals,pointsPerGame:mean(points),finishingRate:totals.shots?totals.goals/totals.shots:null,trendDirection:delta===null?'insufficient-sample':delta>0?'improving':delta<0?'declining':'stable'};
 }
 function interpret(a,b){const left=summarize(a),right=summarize(b),d=left.pointsPerGame===null||right.pointsPerGame===null?null:left.pointsPerGame-right.pointsPerGame;return {sample:Math.min(left.games,right.games)<5?'limited':'comparative',direction:d===null?'unavailable':d>0?'left-higher':d<0?'right-higher':'even',trendLeft:left.trendDirection,trendRight:right.trendDirection,left,right};}
 root.HLMExperimentalPerformanceInsights=Object.freeze({summarize,interpret});
})(window);
