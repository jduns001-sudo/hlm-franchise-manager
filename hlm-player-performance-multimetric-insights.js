'use strict';
// Experimental pure read-only analysis. Never touches production saves or GM decisions.
const METRICS=Object.freeze(['pointsPerGame','goalsPerGame','assistsPerGame','shotsPerGame','finishing']);
function validate(seasons){
 if(!Array.isArray(seasons))throw new TypeError('seasons must be an array');
 const seen=new Set();
 for(const season of seasons){
  if(!season||!Number.isSafeInteger(season.season)||seen.has(season.season)||!Array.isArray(season.games))throw new TypeError('invalid or duplicate season');
  seen.add(season.season);
  for(const game of season.games){
   if(!game||!['goals','assists','shots'].every(k=>Number.isSafeInteger(game[k])&&game[k]>=0)||game.goals>game.shots)throw new TypeError('invalid game');
  }
 }
}
function summarize(seasons,{years=[],metrics=METRICS}={}){
 validate(seasons);
 if(!Array.isArray(years)||years.some(y=>!Number.isSafeInteger(y))||!Array.isArray(metrics)||metrics.some(m=>!METRICS.includes(m)))throw new TypeError('invalid selection');
 const selected=new Set(years),unique=[...new Set(metrics)];
 const rows=seasons.filter(s=>selected.has(s.season)).sort((a,b)=>a.season-b.season).map(s=>{
  const games=s.games.length,goals=s.games.reduce((n,g)=>n+g.goals,0),assists=s.games.reduce((n,g)=>n+g.assists,0),shots=s.games.reduce((n,g)=>n+g.shots,0);
  const values={pointsPerGame:games?(goals+assists)/games:null,goalsPerGame:games?goals/games:null,assistsPerGame:games?assists/games:null,shotsPerGame:games?shots/games:null,finishing:shots?goals/shots:null};
  return Object.freeze({season:s.season,games,shots,confidence:games>=20?'established':games>=5?'developing':'limited',values:Object.freeze(Object.fromEntries(unique.map(m=>[m,values[m]])))});
 });
 const changes=[];
 for(let i=1;i<rows.length;i++){
  const before=rows[i-1],after=rows[i];
  for(const metric of unique){
   const a=before.values[metric],b=after.values[metric],enough=before.games>=5&&after.games>=5&&(metric!=='finishing'||before.shots>=20&&after.shots>=20);
   changes.push(Object.freeze({from:before.season,to:after.season,metric,delta:a===null||b===null?null:b-a,confidence:enough?'directional':'insufficient-sample',explanation:!enough?'Small samples or missing shot volume limit interpretation.': 'Descriptive season difference, not a prediction.'}));
  }
 }
 return Object.freeze({rows:Object.freeze(rows),changes:Object.freeze(changes),notice:'Experimental historical summary only. Human GM retains all decisions.'});
}
function compare(player,team,options){return Object.freeze({player:summarize(player,options),team:summarize(team,options)});}
module.exports={METRICS,summarize,compare};
